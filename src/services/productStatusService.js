import {
    collection,
    doc,
    getDoc,
    serverTimestamp,
    writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
    getLegacyInventoryLotRef,
    markLegacyProductOutOfStockWithLots,
    reactivateLegacyProductWithLots,
    addProductStockAsNewLot,
} from "./inventoryLotService";

import {
    findMatchingHomeProduct,
} from "./homeInventoryService";


/*
 * MARCAR AGOTADO
 *
 * Conservamos exactamente la interfaz
 * utilizada actualmente por ProductCard,
 * pero delegamos la operación real al
 * motor preparado en G.4D.
 */

async function markProductOutOfStock(
    homeId,
    product
) {

    if (
        !product
        || !product.id
    ) {

        throw new Error(
            "No se puede marcar como agotado un producto no válido."
        );

    }


    return await markLegacyProductOutOfStockWithLots(
        homeId,
        product.id
    );

}


/*
 * AÑADIR PRODUCTO AGOTADO
 * A SHOPPING
 *
 * Esta operación no modifica cantidad,
 * caducidad ni apertura.
 *
 * Únicamente crea la relación Shopping
 * y guarda su ID en el producto, por lo
 * que no necesita modificar inventoryLots.
 */

async function addOutOfStockProductToShopping(
    homeId,
    product,
    quantity
) {

    const shoppingQuantity =
        Number.isInteger(
            Number(quantity)
        )
            && Number(quantity) > 0
            ? Number(quantity)
            : 1;


    const batch =
        writeBatch(db);


    const shoppingItemRef = doc(
        collection(
            db,
            "homes",
            homeId,
            "shoppingList"
        )
    );


    batch.set(
        shoppingItemRef,
        {
            name:
                product.name,

            quantity:
                shoppingQuantity,

            storage:
                product.storage || "",

            purchased:
                false,

            source:
                "outOfStock",

            sourceProductId:
                product.id,

            createdAt:
                serverTimestamp(),
        }
    );


    const productRef = doc(
        db,
        "homes",
        homeId,
        "inventory",
        product.id
    );


    batch.update(
        productRef,
        {
            outOfStockShoppingItemId:
                shoppingItemRef.id,
        }
    );


    await batch.commit();


    return shoppingItemRef.id;

}


/*
 * REACTIVAR
 *
 * Conservamos la firma actual utilizada
 * por ProductCard.
 *
 * productName ya no es necesario para
 * realizar la operación porque el nombre
 * se obtiene del documento real dentro
 * del motor de lotes.
 */

async function reactivateProduct(
    homeId,
    {
        productId,
        productName,
        quantityToRestore,
        shoppingItemId,
    }
) {

    /*
     * Evita warning de variable no utilizada
     * manteniendo al mismo tiempo la firma
     * compatible con ProductCard.
     */

    void productName;


    return await reactivateLegacyProductWithLots(
        homeId,
        {
            productId,
            quantityToRestore,
            shoppingItemId,
        }
    );

}


/*
 * RESTAURAR DESDE SHOPPING
 * UN PRODUCTO PROCEDENTE DE AGOTADO
 *
 * Esta acción NO equivale a "Reactivar".
 *
 * Reactivar:
 *   → deshace un agotado accidental
 *   → conserva fechas.
 *
 * Shopping → Inventario:
 *   → representa una compra física nueva
 *   → expirationDate = ""
 *   → openingDate = ""
 *
 * Por tanto recreamos también el lote
 * legacy con las fechas vacías.
 */

async function restoreOutOfStockShoppingItemToInventory(
    homeId,
    shoppingItem,
    originalProductRef,
    originalProductSnapshot,
    shoppingItemRef
) {

    const quantity =
        Number(
            shoppingItem.quantity
        );


    const originalProduct = {
        id:
            originalProductSnapshot.id,

        ...originalProductSnapshot.data(),
    };


    if (
        originalProduct.usesLots === true
        && originalProduct.lotStrategy !== "legacy"
    ) {

        const stockResult =
            await addProductStockAsNewLot(
                homeId,
                originalProduct.id,
                quantity,
                {
                    expirationDate: "",
                    openingDate: "",
                    origin: "shopping",
                }
            );

        const batch = writeBatch(db);
        const movementRef = doc(
            collection(db, "homes", homeId, "movementHistory")
        );

        batch.update(originalProductRef, {
            isOutOfStock: false,
            quantityBeforeOutOfStock: null,
            lotsBeforeOutOfStock: null,
            outOfStockShoppingItemId: "",
            outOfStockReason: null,
        });
        batch.set(movementRef, {
            productId: originalProduct.id,
            productName: originalProduct.name || shoppingItem.name,
            type: "increase",
            quantityChange: quantity,
            previousQuantity: stockResult.previousQuantity,
            newQuantity: stockResult.newQuantity,
            createdAt: serverTimestamp(),
        });
        batch.delete(shoppingItemRef);
        await batch.commit();

        return {
            productId: originalProduct.id,
            quantity: stockResult.newQuantity,
            existingProduct: true,
            lotId: stockResult.lotId,
            lotStrategy: stockResult.lotStrategy,
        };

    }


    const batch =
        writeBatch(db);


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            shoppingItem.sourceProductId
        );


    /*
     * Compra nueva:
     *
     * lote nuevo con fechas vacías.
     */

    batch.set(
        legacyLotRef,
        {
            productId:
                shoppingItem.sourceProductId,

            quantity,

            expirationDate:
                "",

            openingDate:
                "",

            createdAt:
                serverTimestamp(),

            origin:
                "shopping",
        }
    );


    batch.update(
        originalProductRef,
        {
            quantity,

            expirationDate:
                "",

            openingDate:
                "",

            isOutOfStock:
                false,

            quantityBeforeOutOfStock:
                null,

            outOfStockShoppingItemId:
                "",

            usesLots:
                true,

            lotStrategy:
                "legacy",
        }
    );


    const movementRef = doc(
        collection(
            db,
            "homes",
            homeId,
            "movementHistory"
        )
    );


    batch.set(
        movementRef,
        {
            productId:
                shoppingItem.sourceProductId,

            productName:
                shoppingItem.name,

            type:
                "increase",

            quantityChange:
                quantity,

            previousQuantity:
                0,

            newQuantity:
                quantity,

            createdAt:
                serverTimestamp(),
        }
    );


    batch.delete(
        shoppingItemRef
    );


    await batch.commit();


    return {
        productId:
            shoppingItem.sourceProductId,

        quantity,

        existingProduct:
            true,
    };

}


/*
 * TRANSFERENCIA INDIVIDUAL
 * SHOPPING → INVENTARIO
 */

async function addShoppingItemToInventory(
    homeId,
    shoppingItem
) {

    const quantity =
        Number(shoppingItem.quantity);


    if (
        !Number.isInteger(quantity)
        || quantity < 1
    ) {

        throw new Error(
            "La cantidad del producto no es válida."
        );

    }


    if (!shoppingItem.storage) {

        throw new Error(
            "El producto no tiene una ubicación válida."
        );

    }


    const shoppingItemRef = doc(
        db,
        "homes",
        homeId,
        "shoppingList",
        shoppingItem.id
    );


    /*
     * sourceProductId tiene prioridad
     * absoluta para productos que proceden
     * del flujo Agotado.
     */

    if (
        shoppingItem.source === "outOfStock"
        && shoppingItem.sourceProductId
    ) {

        const originalProductRef = doc(
            db,
            "homes",
            homeId,
            "inventory",
            shoppingItem.sourceProductId
        );


        const originalProductSnapshot =
            await getDoc(
                originalProductRef
            );


        if (
            originalProductSnapshot.exists()
        ) {

            return await restoreOutOfStockShoppingItemToInventory(
                homeId,
                shoppingItem,
                originalProductRef,
                originalProductSnapshot,
                shoppingItemRef
            );

        }

    }

    /*
 * G.5C
 *
 * PRODUCTO NORMAL QUE YA EXISTE
 * EN INVENTARIO
 *
 * Identidad conservadora:
 * - mismo nombre normalizado exacto
 * - misma ubicación
 *
 * No fusionamos variantes parecidas.
 */
    const matchingProduct =
        await findMatchingHomeProduct(
            homeId,
            {
                name:
                    shoppingItem.name,

                storage:
                    shoppingItem.storage,
            }
        );


    if (matchingProduct) {

        const previousQuantity =
            Number(
                matchingProduct.quantity
            ) || 0;


        /*
         * La compra nueva constituye un lote
         * físico independiente.
         *
         * No heredamos caducidad ni apertura
         * del stock que ya estaba en casa.
         */
        const stockResult =
            await addProductStockAsNewLot(
                homeId,
                matchingProduct.id,
                quantity,
                {
                    expirationDate:
                        "",

                    openingDate:
                        "",

                    origin:
                        "shopping",
                }
            );


        /*
         * El motor de lotes no registra
         * movementHistory deliberadamente.
         *
         * Lo hacemos aquí porque conocemos
         * el contexto real: compra procedente
         * de Shopping.
         */
        const batch =
            writeBatch(db);


        const movementRef = doc(
            collection(
                db,
                "homes",
                homeId,
                "movementHistory"
            )
        );


        batch.set(
            movementRef,
            {
                productId:
                    matchingProduct.id,

                productName:
                    matchingProduct.name,

                type:
                    "increase",

                quantityChange:
                    quantity,

                previousQuantity,

                newQuantity:
                    stockResult.newQuantity,

                createdAt:
                    serverTimestamp(),
            }
        );


        batch.delete(
            shoppingItemRef
        );


        await batch.commit();


        return {
            productId:
                matchingProduct.id,

            quantity:
                stockResult.newQuantity,

            quantityAdded:
                quantity,

            existingProduct:
                true,

            lotId:
                stockResult.lotId,

            lotStrategy:
                stockResult.lotStrategy,
        };

    }

    /*
     * PRODUCTO NORMAL DE SHOPPING
     *
     * G.5 será el paso encargado de buscar
     * si ya existe la misma ficha lógica
     * y fusionar el stock.
     *
     * Hasta entonces conservamos exactamente
     * el comportamiento anterior:
     *
     * se crea una nueva ficha de inventario.
     *
     * Esa ficha todavía no necesita lote.
     * Se materializará cuando pase por una
     * operación compatible o en G.5.
     */

    const batch =
        writeBatch(db);


    const newProductRef = doc(
        collection(
            db,
            "homes",
            homeId,
            "inventory"
        )
    );


    batch.set(
        newProductRef,
        {
            name:
                shoppingItem.name,

            quantity,

            price:
                0,

            storage:
                shoppingItem.storage,

            expirationDate:
                "",

            openingDate:
                "",

            isOutOfStock:
                false,

            quantityBeforeOutOfStock:
                null,

            outOfStockShoppingItemId:
                "",

            createdAt:
                serverTimestamp(),
        }
    );


    const movementRef = doc(
        collection(
            db,
            "homes",
            homeId,
            "movementHistory"
        )
    );


    batch.set(
        movementRef,
        {
            productId:
                newProductRef.id,

            productName:
                shoppingItem.name,

            type:
                "increase",

            quantityChange:
                quantity,

            previousQuantity:
                0,

            newQuantity:
                quantity,

            createdAt:
                serverTimestamp(),
        }
    );


    batch.delete(
        shoppingItemRef
    );


    await batch.commit();


    return {
        productId:
            newProductRef.id,

        quantity,

        existingProduct:
            false,
    };

}


/*
 * TRANSFERENCIA DE SECCIÓN
 * SHOPPING → INVENTARIO
 *
 * Conservamos el batch único del flujo
 * actual.
 *
 * La diferencia es que cualquier producto
 * procedente de Agotado reconstruye también
 * su lote legacy.
 */

/*
 * TRANSFERENCIA DE SECCIÓN
 * SHOPPING → INVENTARIO
 *
 * G.5D
 *
 * Reutilizamos deliberadamente el flujo
 * individual validado en G.5C.
 *
 * De este modo todos los productos siguen
 * exactamente las mismas reglas:
 *
 * - sourceProductId tiene prioridad
 * - producto lógico existente → nuevo lote
 * - producto inexistente → nueva ficha
 * - no se crean duplicados por utilizar
 *   la transferencia de marcados
 */
async function addShoppingSectionToInventory(
    homeId,
    shoppingItems
) {

    if (
        !Array.isArray(shoppingItems)
        || shoppingItems.length === 0
    ) {

        return {
            processedCount: 0,
            processedIds: [],
        };

    }


    if (shoppingItems.length > 150) {

        throw new Error(
            "La sección contiene demasiados productos para procesarlos de una sola vez."
        );

    }


    /*
     * Validamos todo antes de comenzar.
     *
     * Así evitamos iniciar la transferencia
     * si alguno de los artículos ya contiene
     * datos básicos inválidos.
     */
    for (
        const shoppingItem
        of shoppingItems
    ) {

        const quantity =
            Number(
                shoppingItem.quantity
            );


        if (
            !Number.isInteger(quantity)
            || quantity < 1
        ) {

            throw new Error(
                `La cantidad de "${shoppingItem.name}" no es válida.`
            );

        }


        if (!shoppingItem.storage) {

            throw new Error(
                `"${shoppingItem.name}" no tiene una ubicación válida.`
            );

        }

    }


    const processedIds = [];


    /*
     * Ejecutamos cada artículo mediante
     * addShoppingItemToInventory().
     *
     * Esa función es ahora la única fuente
     * de verdad para Shopping → Inventario.
     *
     * Evitamos mantener dos implementaciones
     * distintas que puedan volver a divergir.
     */
    for (
        const shoppingItem
        of shoppingItems
    ) {

        await addShoppingItemToInventory(
            homeId,
            shoppingItem
        );


        processedIds.push(
            shoppingItem.id
        );

    }


    return {
        processedCount:
            processedIds.length,

        processedIds,
    };

}


export {
    markProductOutOfStock,
    addOutOfStockProductToShopping,
    reactivateProduct,
    addShoppingItemToInventory,
    addShoppingSectionToInventory,
};