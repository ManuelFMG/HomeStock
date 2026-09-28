import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    runTransaction,
} from "firebase/firestore";

import {
    db,
} from "../firebase/firebase";


function getInventoryLotsCollection(
    homeId
) {

    return collection(
        db,
        "homes",
        homeId,
        "inventoryLots"
    );

}


/*
 * REFERENCIA DEL LOTE LEGADO
 *
 * Utilizamos un ID determinista:
 *
 * legacy-{productId}
 *
 * Esto hace que la materialización sea
 * idempotente.
 */

function getLegacyInventoryLotRef(
    homeId,
    productId
) {

    return doc(
        db,
        "homes",
        homeId,
        "inventoryLots",
        `legacy-${productId}`
    );

}


/*
 * VALIDAR CANTIDAD
 */

function getValidInventoryQuantity(
    quantity
) {

    const numericQuantity =
        Number(quantity);


    if (
        !Number.isInteger(
            numericQuantity
        )
        || numericQuantity < 0
    ) {

        return 0;

    }


    return numericQuantity;

}


/*
 * NORMALIZAR FECHA
 */

function normalizeInventoryDate(
    date
) {

    if (
        !date
        || date === "--"
    ) {

        return "";

    }


    return date;

}


/*
 * COMPROBAR QUE EL PRODUCTO
 * PUEDE SER MODIFICADO MEDIANTE
 * LA ESTRATEGIA LEGACY.
 */

function validateLegacyLotStrategy(
    product
) {

    if (
        product?.usesLots === true
        && product?.lotStrategy !== "legacy"
    ) {

        throw new Error(
            "El producto utiliza una estrategia de lotes que esta operación todavía no puede modificar."
        );

    }

}


async function addInventoryLot(
    homeId,
    {
        productId,
        quantity,
        expirationDate = "",
        openingDate = "",
    }
) {

    const numericQuantity =
        Number(quantity);


    if (
        !productId
        || typeof productId !== "string"
    ) {

        throw new Error(
            "El lote necesita un productId válido."
        );

    }


    if (
        !Number.isInteger(
            numericQuantity
        )
        || numericQuantity < 1
    ) {

        throw new Error(
            "La cantidad del lote debe ser un número entero mayor que cero."
        );

    }


    return await addDoc(
        getInventoryLotsCollection(
            homeId
        ),
        {
            productId,

            quantity:
                numericQuantity,

            expirationDate:
                normalizeInventoryDate(
                    expirationDate
                ),

            openingDate:
                normalizeInventoryDate(
                    openingDate
                ),

            createdAt:
                serverTimestamp(),
        }
    );

}


async function getHomeInventoryLots(
    homeId
) {

    const snapshot =
        await getDocs(
            getInventoryLotsCollection(
                homeId
            )
        );


    return snapshot.docs.map(
        (document) => ({
            id:
                document.id,

            ...document.data(),
        })
    );

}


async function getProductInventoryLots(
    homeId,
    productId
) {

    if (!productId) {
        return [];
    }


    const lotsQuery =
        query(
            getInventoryLotsCollection(
                homeId
            ),
            where(
                "productId",
                "==",
                productId
            )
        );


    const snapshot =
        await getDocs(
            lotsQuery
        );


    return snapshot.docs.map(
        (document) => ({
            id:
                document.id,

            ...document.data(),
        })
    );

}


/*
 * PRODUCTO LEGADO → LOTE VIRTUAL
 */

function createLegacyInventoryLot(
    product
) {

    if (
        !product
        || !product.id
    ) {
        return null;
    }


    const quantity =
        getValidInventoryQuantity(
            product.quantity
        );


    if (
        quantity < 1
    ) {
        return null;
    }


    return {
        id:
            `legacy-${product.id}`,

        productId:
            product.id,

        quantity,

        expirationDate:
            normalizeInventoryDate(
                product.expirationDate
            ),

        openingDate:
            normalizeInventoryDate(
                product.openingDate
            ),

        isLegacy:
            true,

        isVirtual:
            true,
    };

}


/*
 * MATERIALIZAR PRODUCTO LEGADO
 *
 * Transición atómica:
 *
 * inventory
 *      ↓
 * inventory + inventoryLots
 *
 * Si existe stock se crea:
 *
 * legacy-{productId}
 *
 * Si quantity === 0 solamente activamos
 * usesLots.
 */

async function materializeLegacyProductLots(
    homeId,
    productId
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede materializar el producto sin homeId y productId."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto que se intenta materializar ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            if (
                product.usesLots === true
            ) {

                return {
                    product,

                    materialized:
                        false,

                    alreadyUsingLots:
                        true,

                    lotCreated:
                        false,
                };

            }


            const quantity =
                getValidInventoryQuantity(
                    product.quantity
                );


            if (
                quantity > 0
            ) {

                transaction.set(
                    legacyLotRef,
                    {
                        productId,

                        quantity,

                        expirationDate:
                            normalizeInventoryDate(
                                product.expirationDate
                            ),

                        openingDate:
                            normalizeInventoryDate(
                                product.openingDate
                            ),

                        createdAt:
                            serverTimestamp(),

                        origin:
                            "legacy",
                    }
                );

            }


            transaction.update(
                productRef,
                {
                    usesLots:
                        true,

                    lotStrategy:
                        "legacy",
                }
            );


            return {
                product: {
                    ...product,

                    quantity,

                    usesLots:
                        true,

                    lotStrategy:
                        "legacy",
                },

                materialized:
                    true,

                alreadyUsingLots:
                    false,

                lotCreated:
                    quantity > 0,

                legacyLotId:
                    quantity > 0
                        ? legacyLotRef.id
                        : null,
            };

        }
    );

}


/*
 * ACTUALIZAR CANTIDAD
 *
 * Operación preparada para la etapa
 * legacy de la migración.
 *
 * Actualiza atómicamente:
 *
 * - inventory.quantity
 * - lote legacy
 * - movementHistory
 *
 * Si el producto todavía no utiliza lotes,
 * queda materializado durante esta misma
 * transacción.
 */

async function updateLegacyProductQuantityWithLots(
    homeId,
    productId,
    newQuantity
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede actualizar la cantidad sin homeId y productId."
        );

    }


    const numericNewQuantity =
        Number(
            newQuantity
        );


    if (
        !Number.isInteger(
            numericNewQuantity
        )
        || numericNewQuantity < 0
    ) {

        throw new Error(
            "La nueva cantidad debe ser un número entero mayor o igual que cero."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    const movementRef =
        doc(
            collection(
                db,
                "homes",
                homeId,
                "movementHistory"
            )
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto que se intenta actualizar ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            validateLegacyLotStrategy(
                product
            );


            const previousQuantity =
                getValidInventoryQuantity(
                    product.quantity
                );


            if (
                numericNewQuantity ===
                previousQuantity
            ) {

                return {
                    previousQuantity,

                    newQuantity:
                        numericNewQuantity,

                    quantityChange:
                        0,

                    changed:
                        false,
                };

            }


            /*
             * PRODUCTO AÚN NO MATERIALIZADO
             */

            if (
                product.usesLots !== true
            ) {

                if (
                    numericNewQuantity > 0
                ) {

                    transaction.set(
                        legacyLotRef,
                        {
                            productId,

                            quantity:
                                numericNewQuantity,

                            expirationDate:
                                normalizeInventoryDate(
                                    product.expirationDate
                                ),

                            openingDate:
                                normalizeInventoryDate(
                                    product.openingDate
                                ),

                            createdAt:
                                serverTimestamp(),

                            origin:
                                "legacy",
                        }
                    );

                }


                transaction.update(
                    productRef,
                    {
                        quantity:
                            numericNewQuantity,

                        usesLots:
                            true,

                        lotStrategy:
                            "legacy",
                    }
                );

            } else {

                /*
                 * PRODUCTO YA MATERIALIZADO
                 */

                if (
                    numericNewQuantity > 0
                ) {

                    const legacyLotSnapshot =
                        await transaction.get(
                            legacyLotRef
                        );


                    if (
                        legacyLotSnapshot.exists()
                    ) {

                        transaction.update(
                            legacyLotRef,
                            {
                                quantity:
                                    numericNewQuantity,
                            }
                        );

                    } else {

                        transaction.set(
                            legacyLotRef,
                            {
                                productId,

                                quantity:
                                    numericNewQuantity,

                                expirationDate:
                                    normalizeInventoryDate(
                                        product.expirationDate
                                    ),

                                openingDate:
                                    normalizeInventoryDate(
                                        product.openingDate
                                    ),

                                createdAt:
                                    serverTimestamp(),

                                origin:
                                    "legacy",
                            }
                        );

                    }

                } else {

                    transaction.delete(
                        legacyLotRef
                    );

                }


                transaction.update(
                    productRef,
                    {
                        quantity:
                            numericNewQuantity,
                    }
                );

            }


            const quantityChange =
                numericNewQuantity
                - previousQuantity;


            transaction.set(
                movementRef,
                {
                    productId,

                    productName:
                        product.name || "",

                    type:
                        quantityChange > 0
                            ? "increase"
                            : "decrease",

                    quantityChange,

                    previousQuantity,

                    newQuantity:
                        numericNewQuantity,

                    createdAt:
                        serverTimestamp(),
                }
            );


            return {
                previousQuantity,

                newQuantity:
                    numericNewQuantity,

                quantityChange,

                changed:
                    true,
            };

        }
    );

}


/*
 * ACTUALIZAR APERTURA
 *
 * Mantiene sincronizados:
 *
 * inventory.openingDate
 * inventoryLots/legacy-{productId}.openingDate
 */

async function updateLegacyProductOpeningWithLots(
    homeId,
    productId,
    openingDate
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede actualizar la apertura sin homeId y productId."
        );

    }


    const normalizedOpeningDate =
        normalizeInventoryDate(
            openingDate
        );


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto que se intenta actualizar ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            validateLegacyLotStrategy(
                product
            );


            const quantity =
                getValidInventoryQuantity(
                    product.quantity
                );


            const previousOpeningDate =
                normalizeInventoryDate(
                    product.openingDate
                );


            if (
                previousOpeningDate ===
                normalizedOpeningDate
            ) {

                return {
                    previousOpeningDate,

                    openingDate:
                        normalizedOpeningDate,

                    changed:
                        false,
                };

            }


            if (
                product.usesLots !== true
            ) {

                if (
                    quantity > 0
                ) {

                    transaction.set(
                        legacyLotRef,
                        {
                            productId,

                            quantity,

                            expirationDate:
                                normalizeInventoryDate(
                                    product.expirationDate
                                ),

                            openingDate:
                                normalizedOpeningDate,

                            createdAt:
                                serverTimestamp(),

                            origin:
                                "legacy",
                        }
                    );

                }


                transaction.update(
                    productRef,
                    {
                        openingDate:
                            normalizedOpeningDate,

                        usesLots:
                            true,

                        lotStrategy:
                            "legacy",
                    }
                );

            } else {

                if (
                    quantity > 0
                ) {

                    const legacyLotSnapshot =
                        await transaction.get(
                            legacyLotRef
                        );


                    if (
                        legacyLotSnapshot.exists()
                    ) {

                        transaction.update(
                            legacyLotRef,
                            {
                                openingDate:
                                    normalizedOpeningDate,
                            }
                        );

                    } else {

                        transaction.set(
                            legacyLotRef,
                            {
                                productId,

                                quantity,

                                expirationDate:
                                    normalizeInventoryDate(
                                        product.expirationDate
                                    ),

                                openingDate:
                                    normalizedOpeningDate,

                                createdAt:
                                    serverTimestamp(),

                                origin:
                                    "legacy",
                            }
                        );

                    }

                }


                transaction.update(
                    productRef,
                    {
                        openingDate:
                            normalizedOpeningDate,
                    }
                );

            }


            return {
                previousOpeningDate,

                openingDate:
                    normalizedOpeningDate,

                changed:
                    true,
            };

        }
    );

}


/*
 * EDITAR PRODUCTO LEGACY
 *
 * Mantiene sincronizados:
 *
 * inventory
 * +
 * inventoryLots/legacy-{productId}
 *
 * y registra movementHistory
 * si cambia quantity.
 */

async function updateLegacyProductWithLots(
    homeId,
    productId,
    productData
) {

    if (
        !homeId
        || !productId
        || !productData
    ) {

        throw new Error(
            "No se puede editar el producto sin los datos necesarios."
        );

    }


    const numericQuantity =
        Number(
            productData.quantity
        );


    if (
        !Number.isInteger(
            numericQuantity
        )
        || numericQuantity < 0
    ) {

        throw new Error(
            "La cantidad del producto debe ser un número entero mayor o igual que cero."
        );

    }


    const numericPrice =
        Number(
            productData.price
        );


    if (
        Number.isNaN(
            numericPrice
        )
        || numericPrice < 0
    ) {

        throw new Error(
            "El precio del producto no es válido."
        );

    }


    const normalizedExpirationDate =
        normalizeInventoryDate(
            productData.expirationDate
        );


    const normalizedOpeningDate =
        normalizeInventoryDate(
            productData.openingDate
        );


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    const movementRef =
        doc(
            collection(
                db,
                "homes",
                homeId,
                "movementHistory"
            )
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto que se intenta editar ya no existe."
                );

            }


            const currentProduct = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            validateLegacyLotStrategy(
                currentProduct
            );


            const previousQuantity =
                getValidInventoryQuantity(
                    currentProduct.quantity
                );


            /*
             * Todas las lecturas necesarias
             * se realizan antes de escribir.
             */

            let legacyLotSnapshot =
                null;


            if (
                currentProduct.usesLots === true
                && numericQuantity > 0
            ) {

                legacyLotSnapshot =
                    await transaction.get(
                        legacyLotRef
                    );

            }


            const updatedProductData = {
                name:
                    String(
                        productData.name || ""
                    ).trim(),

                quantity:
                    numericQuantity,

                price:
                    numericPrice,

                storage:
                    productData.storage || "",

                expirationDate:
                    normalizedExpirationDate,

                openingDate:
                    normalizedOpeningDate,

                daysAfterOpening:
                    productData.daysAfterOpening ?? "",

                usesLots:
                    true,

                lotStrategy:
                    "legacy",
            };


            if (
                numericQuantity === 0
            ) {

                if (
                    currentProduct.usesLots === true
                ) {

                    transaction.delete(
                        legacyLotRef
                    );

                }


                transaction.update(
                    productRef,
                    updatedProductData
                );

            } else {

                if (
                    currentProduct.usesLots !== true
                ) {

                    transaction.set(
                        legacyLotRef,
                        {
                            productId,

                            quantity:
                                numericQuantity,

                            expirationDate:
                                normalizedExpirationDate,

                            openingDate:
                                normalizedOpeningDate,

                            createdAt:
                                serverTimestamp(),

                            origin:
                                "legacy",
                        }
                    );

                } else if (
                    legacyLotSnapshot
                    && legacyLotSnapshot.exists()
                ) {

                    transaction.update(
                        legacyLotRef,
                        {
                            quantity:
                                numericQuantity,

                            expirationDate:
                                normalizedExpirationDate,

                            openingDate:
                                normalizedOpeningDate,
                        }
                    );

                } else {

                    transaction.set(
                        legacyLotRef,
                        {
                            productId,

                            quantity:
                                numericQuantity,

                            expirationDate:
                                normalizedExpirationDate,

                            openingDate:
                                normalizedOpeningDate,

                            createdAt:
                                serverTimestamp(),

                            origin:
                                "legacy",
                        }
                    );

                }


                transaction.update(
                    productRef,
                    updatedProductData
                );

            }


            const quantityChange =
                numericQuantity
                - previousQuantity;


            if (
                quantityChange !== 0
            ) {

                transaction.set(
                    movementRef,
                    {
                        productId,

                        productName:
                            updatedProductData.name,

                        type:
                            quantityChange > 0
                                ? "increase"
                                : "decrease",

                        quantityChange,

                        previousQuantity,

                        newQuantity:
                            numericQuantity,

                        createdAt:
                            serverTimestamp(),
                    }
                );

            }


            return {
                previousQuantity,

                newQuantity:
                    numericQuantity,

                quantityChange,

                changed:
                    true,

                product: {
                    ...currentProduct,
                    ...updatedProductData,
                },
            };

        }
    );

}


/*
 * MARCAR PRODUCTO COMO AGOTADO
 *
 * Esta operación sustituirá posteriormente
 * al comportamiento legacy actual de
 * productStatusService.
 *
 * Mantiene en una sola transacción:
 *
 * - inventory.quantity = 0
 * - isOutOfStock = true
 * - quantityBeforeOutOfStock
 * - eliminación del lote legacy
 * - movementHistory
 *
 * Si el producto todavía no estaba
 * materializado, queda marcado ya con:
 *
 * usesLots: true
 * lotStrategy: "legacy"
 *
 * No creamos primero un lote para
 * eliminarlo inmediatamente.
 */

async function markLegacyProductOutOfStockWithLots(
    homeId,
    productId
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede marcar el producto como agotado sin homeId y productId."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    const movementRef =
        doc(
            collection(
                db,
                "homes",
                homeId,
                "movementHistory"
            )
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto que se intenta marcar como agotado ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            validateLegacyLotStrategy(
                product
            );


            /*
             * Si ya estaba agotado no
             * repetimos movimientos ni
             * modificamos quantityBeforeOutOfStock.
             */

            if (
                product.isOutOfStock === true
            ) {

                return {
                    previousQuantity:
                        getValidInventoryQuantity(
                            product.quantityBeforeOutOfStock
                        ),

                    changed:
                        false,
                };

            }


            const previousQuantity =
                getValidInventoryQuantity(
                    product.quantity
                );


            /*
             * El lote legacy deja de
             * representar stock físico.
             *
             * delete() sobre un documento
             * inexistente es una operación
             * segura, por lo que podemos
             * utilizar el ID determinista
             * incluso si el producto todavía
             * no se había materializado.
             */

            transaction.delete(
                legacyLotRef
            );


            transaction.update(
                productRef,
                {
                    quantity:
                        0,

                    isOutOfStock:
                        true,

                    quantityBeforeOutOfStock:
                        previousQuantity,

                    outOfStockShoppingItemId:
                        "",

                    usesLots:
                        true,

                    lotStrategy:
                        "legacy",
                }
            );


            if (
                previousQuantity > 0
            ) {

                transaction.set(
                    movementRef,
                    {
                        productId,

                        productName:
                            product.name || "",

                        type:
                            "decrease",

                        quantityChange:
                            -previousQuantity,

                        previousQuantity,

                        newQuantity:
                            0,

                        createdAt:
                            serverTimestamp(),
                    }
                );

            }


            return {
                previousQuantity,

                changed:
                    true,
            };

        }
    );

}


/*
 * REACTIVAR PRODUCTO AGOTADO
 *
 * Reconstruye el lote legacy utilizando:
 *
 * quantityBeforeOutOfStock
 * expirationDate
 * openingDate
 *
 * del documento principal.
 *
 * También elimina, si existe, el elemento
 * de Shopping relacionado con Agotado.
 *
 * Todo ocurre dentro de la misma
 * transacción.
 */

async function reactivateLegacyProductWithLots(
    homeId,
    {
        productId,
        quantityToRestore,
        shoppingItemId,
    }
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede reactivar el producto sin homeId y productId."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    const movementRef =
        doc(
            collection(
                db,
                "homes",
                homeId,
                "movementHistory"
            )
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto que se intenta reactivar ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            validateLegacyLotStrategy(
                product
            );


            /*
             * El documento guardado por
             * markOutOfStock es nuestra
             * primera fuente de verdad.
             *
             * quantityToRestore se mantiene
             * como fallback de compatibilidad
             * con el flujo actual de ProductCard.
             */

            const savedQuantity =
                Number(
                    product.quantityBeforeOutOfStock
                );


            const fallbackQuantity =
                Number(
                    quantityToRestore
                );


            const restoredQuantity =
                Number.isInteger(
                    savedQuantity
                )
                    && savedQuantity >= 0
                    ? savedQuantity
                    : Number.isInteger(
                        fallbackQuantity
                    )
                        && fallbackQuantity >= 0
                        ? fallbackQuantity
                        : 0;


            const linkedShoppingItemId =
                product.outOfStockShoppingItemId
                || shoppingItemId
                || "";


            /*
             * Si vuelve a existir stock,
             * reconstruimos el lote real.
             *
             * Se trata de una nueva existencia
             * física tras haber estado agotado,
             * por lo que recibe createdAt.
             */

            if (
                restoredQuantity > 0
            ) {

                transaction.set(
                    legacyLotRef,
                    {
                        productId,

                        quantity:
                            restoredQuantity,

                        expirationDate:
                            normalizeInventoryDate(
                                product.expirationDate
                            ),

                        openingDate:
                            normalizeInventoryDate(
                                product.openingDate
                            ),

                        createdAt:
                            serverTimestamp(),

                        origin:
                            "legacy",
                    }
                );

            } else {

                transaction.delete(
                    legacyLotRef
                );

            }


            transaction.update(
                productRef,
                {
                    quantity:
                        restoredQuantity,

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


            if (
                linkedShoppingItemId
            ) {

                const shoppingItemRef =
                    doc(
                        db,
                        "homes",
                        homeId,
                        "shoppingList",
                        linkedShoppingItemId
                    );


                transaction.delete(
                    shoppingItemRef
                );

            }


            if (
                restoredQuantity > 0
            ) {

                transaction.set(
                    movementRef,
                    {
                        productId,

                        productName:
                            product.name || "",

                        type:
                            "increase",

                        quantityChange:
                            restoredQuantity,

                        previousQuantity:
                            0,

                        newQuantity:
                            restoredQuantity,

                        createdAt:
                            serverTimestamp(),
                    }
                );

            }


            return {
                restoredQuantity,

                changed:
                    true,
            };

        }
    );

}


/*
 * ELIMINAR PRODUCTO LEGACY
 *
 * Elimina de forma atómica:
 *
 * inventory/{productId}
 * inventoryLots/legacy-{productId}
 *
 * En esta fase solo aceptamos:
 *
 * - productos todavía no materializados
 * - lotStrategy === "legacy"
 *
 * Cuando lleguemos al modelo multi-lote
 * ampliaremos esta operación para eliminar
 * todos los lotes físicos del producto.
 */

async function deleteLegacyProductWithLots(
    homeId,
    productId
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede eliminar el producto sin homeId y productId."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            /*
             * Eliminación idempotente:
             * si ya no existe, no hacemos nada.
             */

            if (
                !productSnapshot.exists()
            ) {

                return {
                    deleted:
                        false,
                };

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            validateLegacyLotStrategy(
                product
            );


            transaction.delete(
                legacyLotRef
            );


            transaction.delete(
                productRef
            );


            return {
                deleted:
                    true,
            };

        }
    );

}


/*
 * OBTENER LOTES EFECTIVOS
 */

function getEffectiveProductLots(
    product,
    inventoryLots = []
) {

    if (
        !product
        || !product.id
    ) {
        return [];
    }


    const realLots =
        Array.isArray(
            inventoryLots
        )
            ? inventoryLots.filter(
                (lot) =>
                    lot.productId ===
                    product.id
            )
            : [];


    if (
        realLots.length > 0
    ) {

        return realLots;

    }


    if (
        product.usesLots === true
    ) {

        return [];

    }


    const legacyLot =
        createLegacyInventoryLot(
            product
        );


    return legacyLot
        ? [legacyLot]
        : [];

}


/*
 * AGRUPAR LOTES POR PRODUCTO
 */

function groupInventoryLotsByProduct(
    products = [],
    inventoryLots = []
) {

    const lotsByProduct =
        new Map();


    if (
        !Array.isArray(
            products
        )
    ) {

        return lotsByProduct;

    }


    products.forEach(
        (product) => {

            lotsByProduct.set(
                product.id,
                getEffectiveProductLots(
                    product,
                    inventoryLots
                )
            );

        }
    );


    return lotsByProduct;

}


/*
 * SUMAR CANTIDAD REAL DE LOTES
 */

function calculateInventoryLotsQuantity(
    lots = []
) {

    if (
        !Array.isArray(
            lots
        )
    ) {
        return 0;
    }


    return lots.reduce(
        (
            total,
            lot
        ) => {

            const quantity =
                Number(
                    lot?.quantity
                );


            if (
                !Number.isInteger(
                    quantity
                )
                || quantity < 1
            ) {

                return total;

            }


            return (
                total
                + quantity
            );

        },
        0
    );

}

/*
 * RESUMEN DE STOCK POR PRODUCTO
 *
 * Construye una vista segura del stock
 * utilizando los lotes efectivos.
 *
 * No escribe nada en Firestore.
 *
 * Nos servirá para comprobar y consumir
 * productos legacy y multi mediante una
 * misma interfaz.
 */
function getProductLotsSummary(
    product,
    inventoryLots = []
) {

    if (
        !product
        || !product.id
    ) {

        return {
            productId: "",
            lots: [],
            lotCount: 0,
            lotsQuantity: 0,
            productQuantity: 0,
            quantityMatches: true,
            usesLots: false,
            lotStrategy: null,
            isMultiLot: false,
        };

    }


    const lots =
        getEffectiveProductLots(
            product,
            inventoryLots
        );


    const lotsQuantity =
        calculateInventoryLotsQuantity(
            lots
        );


    const productQuantity =
        getValidInventoryQuantity(
            product.quantity
        );


    return {
        productId:
            product.id,

        lots,

        lotCount:
            lots.length,

        lotsQuantity,

        productQuantity,

        quantityMatches:
            lotsQuantity ===
            productQuantity,

        usesLots:
            product.usesLots === true,

        lotStrategy:
            product.usesLots === true
                ? product.lotStrategy || null
                : null,

        isMultiLot:
            product.usesLots === true
            && product.lotStrategy === "multi",
    };

}

/*
 * AÑADIR STOCK COMO NUEVO LOTE
 *
 * Motor preparado para la transición:
 *
 * legacy -> multi
 *
 * No está conectado todavía a Shopping.
 *
 * Mantiene atómicamente:
 * - el stock legado existente, si lo hay
 * - un nuevo lote físico independiente
 * - inventory.quantity como agregado
 * - usesLots = true
 * - lotStrategy = "multi"
 *
 * No registra movementHistory porque el
 * llamador final será quien deba decidir
 * el contexto del movimiento.
 */
async function addProductStockAsNewLot(
    homeId,
    productId,
    quantityToAdd,
    {
        expirationDate = "",
        openingDate = "",
        origin = "manual",
    } = {}
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede añadir un nuevo lote sin homeId y productId."
        );

    }


    const numericQuantityToAdd =
        Number(quantityToAdd);


    if (
        !Number.isInteger(
            numericQuantityToAdd
        )
        || numericQuantityToAdd < 1
    ) {

        throw new Error(
            "La cantidad del nuevo lote debe ser un número entero mayor que cero."
        );

    }


    const productRef = doc(
        db,
        "homes",
        homeId,
        "inventory",
        productId
    );


    const legacyLotRef =
        getLegacyInventoryLotRef(
            homeId,
            productId
        );


    const newLotRef = doc(
        getInventoryLotsCollection(
            homeId
        )
    );


    return await runTransaction(
        db,
        async (transaction) => {

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto al que se intenta añadir stock ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            const previousQuantity =
                getValidInventoryQuantity(
                    product.quantity
                );


            const currentStrategy =
                product.usesLots === true
                    ? product.lotStrategy
                    : null;


            if (
                currentStrategy
                && currentStrategy !== "legacy"
                && currentStrategy !== "multi"
            ) {

                throw new Error(
                    "El producto utiliza una estrategia de lotes no compatible con esta operación."
                );

            }


            /*
             * Si el producto ya estaba materializado
             * como legacy, leemos el lote antes de
             * comenzar cualquier escritura.
             */
            let legacyLotSnapshot = null;


            if (
                product.usesLots === true
                && product.lotStrategy === "legacy"
                && previousQuantity > 0
            ) {

                legacyLotSnapshot =
                    await transaction.get(
                        legacyLotRef
                    );

            }


            /*
             * Producto todavía no materializado:
             * conservamos su stock actual como lote
             * legacy antes de añadir el lote nuevo.
             */
            if (
                product.usesLots !== true
                && previousQuantity > 0
            ) {

                transaction.set(
                    legacyLotRef,
                    {
                        productId,

                        quantity:
                            previousQuantity,

                        expirationDate:
                            normalizeInventoryDate(
                                product.expirationDate
                            ),

                        openingDate:
                            normalizeInventoryDate(
                                product.openingDate
                            ),

                        createdAt:
                            serverTimestamp(),

                        origin:
                            "legacy",
                    }
                );

            } else if (
                product.usesLots === true
                && product.lotStrategy === "legacy"
                && previousQuantity > 0
                && !legacyLotSnapshot?.exists()
            ) {

                /*
                 * Recuperación defensiva:
                 * si el agregado dice que hay stock
                 * pero falta el lote legacy, lo
                 * reconstruimos antes de pasar a multi.
                 */
                transaction.set(
                    legacyLotRef,
                    {
                        productId,

                        quantity:
                            previousQuantity,

                        expirationDate:
                            normalizeInventoryDate(
                                product.expirationDate
                            ),

                        openingDate:
                            normalizeInventoryDate(
                                product.openingDate
                            ),

                        createdAt:
                            serverTimestamp(),

                        origin:
                            "legacy",
                    }
                );

            }


            transaction.set(
                newLotRef,
                {
                    productId,

                    quantity:
                        numericQuantityToAdd,

                    expirationDate:
                        normalizeInventoryDate(
                            expirationDate
                        ),

                    openingDate:
                        normalizeInventoryDate(
                            openingDate
                        ),

                    createdAt:
                        serverTimestamp(),

                    origin:
                        String(
                            origin || "manual"
                        ),
                }
            );


            const newQuantity =
                previousQuantity
                + numericQuantityToAdd;


            transaction.update(
                productRef,
                {
                    quantity:
                        newQuantity,

                    usesLots:
                        true,

                    lotStrategy:
                        "multi",
                }
            );


            return {
                productId,

                lotId:
                    newLotRef.id,

                previousQuantity,

                quantityAdded:
                    numericQuantityToAdd,

                newQuantity,

                lotStrategy:
                    "multi",
            };

        }
    );

}

/*
 * ABRIR UNIDADES DE UN LOTE
 *
 * G.7E.1
 *
 * Esta operación sirve tanto para:
 *
 * - productos todavía no materializados
 * - productos legacy
 * - productos multi
 *
 * La primera apertura por unidades convierte
 * el producto al modelo de operaciones por lote:
 *
 * usesLots: true
 * lotStrategy: "multi"
 *
 * inventory.quantity NO cambia.
 *
 * Apertura parcial:
 *
 * lote cerrado x5
 * abrir 2
 *
 * =>
 *
 * lote original cerrado x3
 * nuevo lote abierto x2
 *
 * Apertura completa:
 *
 * lote cerrado x5
 * abrir 5
 *
 * =>
 *
 * mismo lote abierto x5
 */
async function splitInventoryLotForOpening(
    homeId,
    productId,
    lotId,
    quantityToOpen,
    openingDate
) {

    if (
        !homeId
        || !productId
        || !lotId
    ) {

        throw new Error(
            "No se puede abrir el lote sin homeId, productId y lotId."
        );

    }


    const numericQuantityToOpen =
        Number(
            quantityToOpen
        );


    if (
        !Number.isInteger(
            numericQuantityToOpen
        )
        || numericQuantityToOpen < 1
    ) {

        throw new Error(
            "La cantidad a abrir debe ser un número entero mayor que cero."
        );

    }


    const normalizedOpeningDate =
        normalizeInventoryDate(
            openingDate
        );


    if (!normalizedOpeningDate) {

        throw new Error(
            "La fecha de apertura no es válida."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const expectedLegacyLotId =
        `legacy-${productId}`;


    const lotRef =
        doc(
            db,
            "homes",
            homeId,
            "inventoryLots",
            lotId
        );


    const openedLotRef =
        doc(
            getInventoryLotsCollection(
                homeId
            )
        );


    return await runTransaction(
        db,
        async (transaction) => {

            /*
             * Todas las lecturas ocurren antes
             * de cualquier escritura.
             */

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto al que pertenece el lote ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            const currentStrategy =
                product.usesLots === true
                    ? product.lotStrategy
                    : null;


            if (
                currentStrategy
                && currentStrategy !== "legacy"
                && currentStrategy !== "multi"
            ) {

                throw new Error(
                    "El producto utiliza una estrategia de lotes no compatible con la apertura por unidades."
                );

            }


            /*
             * Para productos no materializados
             * o legacy, el único lote válido es
             * el determinista legacy-{productId}.
             */

            const isLegacySource =
                product.usesLots !== true
                || product.lotStrategy === "legacy";


            if (
                isLegacySource
                && lotId !== expectedLegacyLotId
            ) {

                throw new Error(
                    "El lote indicado no corresponde al stock legacy del producto."
                );

            }


            const lotSnapshot =
                await transaction.get(
                    lotRef
                );


            /*
             * En un producto multi el lote debe
             * existir físicamente.
             *
             * En un producto legacy todavía puede
             * ser virtual, por lo que reconstruimos
             * sus datos desde inventory.
             */

            if (
                !lotSnapshot.exists()
                && !isLegacySource
            ) {

                throw new Error(
                    "El lote que se intenta abrir ya no existe."
                );

            }


            let lot;


            if (
                lotSnapshot.exists()
            ) {

                lot = {
                    id:
                        lotSnapshot.id,

                    ...lotSnapshot.data(),
                };


                if (
                    lot.productId !==
                    productId
                ) {

                    throw new Error(
                        "El lote no pertenece al producto indicado."
                    );

                }

            } else {

                lot = {
                    id:
                        expectedLegacyLotId,

                    productId,

                    quantity:
                        getValidInventoryQuantity(
                            product.quantity
                        ),

                    expirationDate:
                        normalizeInventoryDate(
                            product.expirationDate
                        ),

                    openingDate:
                        normalizeInventoryDate(
                            product.openingDate
                        ),

                    origin:
                        "legacy",
                };

            }


            const lotQuantity =
                Number(
                    lot.quantity
                );


            if (
                !Number.isInteger(
                    lotQuantity
                )
                || lotQuantity < 1
            ) {

                throw new Error(
                    "La cantidad almacenada en el lote no es válida."
                );

            }


            const currentOpeningDate =
                normalizeInventoryDate(
                    lot.openingDate
                );


            if (currentOpeningDate) {

                throw new Error(
                    "El lote seleccionado ya está abierto."
                );

            }


            if (
                numericQuantityToOpen >
                lotQuantity
            ) {

                throw new Error(
                    "No puedes abrir más unidades de las disponibles en el lote."
                );

            }


            const normalizedExpirationDate =
                normalizeInventoryDate(
                    lot.expirationDate
                );


            const normalizedOrigin =
                String(
                    lot.origin
                    || (
                        isLegacySource
                            ? "legacy"
                            : "manual"
                    )
                );


            /*
             * CASO 1
             *
             * Se abre el lote completo.
             *
             * Si el lote todavía era virtual,
             * lo materializamos directamente
             * como lote abierto.
             */

            if (
                numericQuantityToOpen ===
                lotQuantity
            ) {

                if (
                    lotSnapshot.exists()
                ) {

                    transaction.update(
                        lotRef,
                        {
                            openingDate:
                                normalizedOpeningDate,
                        }
                    );

                } else {

                    transaction.set(
                        lotRef,
                        {
                            productId,

                            quantity:
                                lotQuantity,

                            expirationDate:
                                normalizedExpirationDate,

                            openingDate:
                                normalizedOpeningDate,

                            createdAt:
                                serverTimestamp(),

                            origin:
                                normalizedOrigin,
                        }
                    );

                }


                transaction.update(
                    productRef,
                    {
                        usesLots:
                            true,

                        lotStrategy:
                            "multi",

                        /*
                         * Desde este momento la apertura
                         * vive exclusivamente en los lotes.
                         */
                        openingDate:
                            "",
                    }
                );


                return {
                    productId,

                    sourceLotId:
                        lotId,

                    openedLotId:
                        lotId,

                    quantityOpened:
                        numericQuantityToOpen,

                    remainingQuantity:
                        0,

                    split:
                        false,

                    openingDate:
                        normalizedOpeningDate,

                    lotStrategy:
                        "multi",
                };

            }


            /*
             * CASO 2
             *
             * Apertura parcial.
             *
             * El lote original conserva únicamente
             * las unidades que siguen cerradas.
             */

            const remainingQuantity =
                lotQuantity
                - numericQuantityToOpen;


            if (
                lotSnapshot.exists()
            ) {

                transaction.update(
                    lotRef,
                    {
                        quantity:
                            remainingQuantity,

                        openingDate:
                            "",
                    }
                );

            } else {

                transaction.set(
                    lotRef,
                    {
                        productId,

                        quantity:
                            remainingQuantity,

                        expirationDate:
                            normalizedExpirationDate,

                        openingDate:
                            "",

                        createdAt:
                            serverTimestamp(),

                        origin:
                            normalizedOrigin,
                    }
                );

            }


            /*
             * Las unidades abiertas forman un lote
             * temporalmente separado, pero guardamos
             * exactamente de qué lote proceden.
             *
             * G.7E.2 utiliza splitFromLotId para
             * devolverlas al lote original si el
             * usuario deshace la apertura.
             */

            transaction.set(
                openedLotRef,
                {
                    productId,

                    quantity:
                        numericQuantityToOpen,

                    expirationDate:
                        normalizedExpirationDate,

                    openingDate:
                        normalizedOpeningDate,

                    createdAt:
                        serverTimestamp(),

                    origin:
                        normalizedOrigin,

                    splitFromLotId:
                        String(
                            lot.splitFromLotId
                            || lot.id
                        ),
                }
            );


            transaction.update(
                productRef,
                {
                    usesLots:
                        true,

                    lotStrategy:
                        "multi",

                    openingDate:
                        "",
                }
            );


            return {
                productId,

                sourceLotId:
                    lotId,

                openedLotId:
                    openedLotRef.id,

                quantityOpened:
                    numericQuantityToOpen,

                remainingQuantity,

                split:
                    true,

                openingDate:
                    normalizedOpeningDate,

                lotStrategy:
                    "multi",
            };

        }
    );

}


/*
 * DESHACER APERTURA DE UN LOTE
 *
 * G.7E.2
 *
 * Si el lote abierto fue creado mediante
 * una apertura parcial:
 *
 * lote original cerrado x3
 * lote abierto x2
 *
 * =>
 *
 * lote original cerrado x5
 * lote abierto eliminado
 *
 * Si se abrió el lote completo y no hubo
 * split, simplemente eliminamos openingDate.
 *
 * inventory.quantity NO cambia.
 * movementHistory NO cambia.
 */
async function undoInventoryLotOpening(
    homeId,
    productId,
    lotId,
    familyLotIds = []
) {

    if (
        !homeId
        || !productId
        || !lotId
    ) {

        throw new Error(
            "No se puede deshacer la apertura sin homeId, productId y lotId."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const lotRef =
        doc(
            db,
            "homes",
            homeId,
            "inventoryLots",
            lotId
        );


    return await runTransaction(
        db,
        async (transaction) => {

            /*
             * PRIMERA FASE: SOLO LECTURAS
             */
            const productSnapshot =
                await transaction.get(
                    productRef
                );


            const lotSnapshot =
                await transaction.get(
                    lotRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto al que pertenece el lote ya no existe."
                );

            }


            if (
                !lotSnapshot.exists()
            ) {

                throw new Error(
                    "El lote cuya apertura se intenta deshacer ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            const lot = {
                id:
                    lotSnapshot.id,

                ...lotSnapshot.data(),
            };


            if (
                lot.productId !==
                productId
            ) {

                throw new Error(
                    "El lote no pertenece al producto indicado."
                );

            }


            if (
                !normalizeInventoryDate(
                    lot.openingDate
                )
            ) {

                throw new Error(
                    "El lote seleccionado no está abierto."
                );

            }


            const canonicalRootId =
                String(
                    lot.splitFromLotId
                    || lot.id
                );


            /*
             * Recibimos desde la UI todos los documentos
             * físicos que actualmente forman este lote
             * principal. Añadimos siempre el objetivo y
             * la raíz para que la operación sea robusta.
             */
            const requestedIds =
                Array.isArray(
                    familyLotIds
                )
                    ? familyLotIds
                    : [];


            const familyIds =
                Array.from(
                    new Set([
                        canonicalRootId,
                        lotId,
                        ...requestedIds,
                    ].filter(Boolean))
                );


            const familyRefs =
                familyIds.map(
                    (currentLotId) =>
                        doc(
                            db,
                            "homes",
                            homeId,
                            "inventoryLots",
                            currentLotId
                        )
                );


            const familySnapshots = [];


            for (
                const currentRef
                of familyRefs
            ) {

                familySnapshots.push(
                    await transaction.get(
                        currentRef
                    )
                );

            }


            const familyLots =
                familySnapshots
                    .filter(
                        (snapshot) =>
                            snapshot.exists()
                    )
                    .map(
                        (snapshot) => ({
                            id:
                                snapshot.id,

                            ...snapshot.data(),
                        })
                    )
                    .filter(
                        (currentLot) => {

                            if (
                                currentLot.productId !==
                                productId
                            ) {
                                return false;
                            }


                            const currentRootId =
                                String(
                                    currentLot.splitFromLotId
                                    || currentLot.id
                                );


                            return (
                                currentRootId ===
                                canonicalRootId
                            );

                        }
                    );


            if (
                familyLots.length === 0
            ) {

                throw new Error(
                    "No se ha podido reconstruir el lote principal."
                );

            }


            /*
             * Simulamos el estado DESPUÉS de deshacer:
             * únicamente el lote pulsado pasa a cerrado.
             */
            const resultingLots =
                familyLots.map(
                    (currentLot) =>
                        currentLot.id === lotId
                            ? {
                                ...currentLot,
                                openingDate: "",
                            }
                            : currentLot
                );


            const openedLots =
                resultingLots.filter(
                    (currentLot) =>
                        Boolean(
                            normalizeInventoryDate(
                                currentLot.openingDate
                            )
                        )
                );


            const closedLots =
                resultingLots.filter(
                    (currentLot) =>
                        !normalizeInventoryDate(
                            currentLot.openingDate
                        )
                );


            const getLotQuantity =
                (currentLot) => {

                    const quantity =
                        Number(
                            currentLot.quantity
                        );


                    if (
                        !Number.isInteger(
                            quantity
                        )
                        || quantity < 1
                    ) {

                        throw new Error(
                            "La cantidad de uno de los segmentos del lote no es válida."
                        );

                    }


                    return quantity;

                };


            const totalFamilyQuantity =
                resultingLots.reduce(
                    (
                        total,
                        currentLot
                    ) =>
                        total
                        + getLotQuantity(
                            currentLot
                        ),
                    0
                );


            const closedQuantity =
                closedLots.reduce(
                    (
                        total,
                        currentLot
                    ) =>
                        total
                        + getLotQuantity(
                            currentLot
                        ),
                    0
                );


            const rootLot =
                resultingLots.find(
                    (currentLot) =>
                        currentLot.id ===
                        canonicalRootId
                ) || null;


            if (!rootLot) {

                throw new Error(
                    "No se encuentra el documento raíz del lote principal."
                );

            }


            /*
             * SEGUNDA FASE: ESCRITURAS
             *
             * REGLA PRINCIPAL:
             * - mientras queden unidades abiertas,
             *   mantenemos como máximo UN segmento cerrado;
             * - cuando ya no quede ninguna abierta,
             *   reconstruimos TODO el lote en su raíz.
             *
             * Así el resultado es independiente del orden
             * en que el usuario pulse "Deshacer apertura".
             */
            if (
                openedLots.length === 0
            ) {

                const rootRef =
                    doc(
                        db,
                        "homes",
                        homeId,
                        "inventoryLots",
                        canonicalRootId
                    );


                transaction.set(
                    rootRef,
                    {
                        productId,

                        quantity:
                            totalFamilyQuantity,

                        expirationDate:
                            normalizeInventoryDate(
                                rootLot.expirationDate
                            ),

                        openingDate:
                            "",

                        origin:
                            String(
                                rootLot.origin
                                || "manual"
                            ),
                    },
                    {
                        merge:
                            true,
                    }
                );


                for (
                    const currentLot
                    of resultingLots
                ) {

                    if (
                        currentLot.id !==
                        canonicalRootId
                    ) {

                        transaction.delete(
                            doc(
                                db,
                                "homes",
                                homeId,
                                "inventoryLots",
                                currentLot.id
                            )
                        );

                    }

                }


                if (
                    product.openingDate
                ) {

                    transaction.update(
                        productRef,
                        {
                            openingDate:
                                "",
                        }
                    );

                }


                return {
                    productId,

                    lotId,

                    sourceLotId:
                        canonicalRootId,

                    restoredQuantity:
                        totalFamilyQuantity,

                    familyFullyClosed:
                        true,

                    closedSegments:
                        1,
                };

            }


            /*
             * Todavía quedan unidades abiertas.
             * Consolidamos TODAS las cerradas en un
             * único documento físico.
             */
            const rootIsClosed =
                closedLots.some(
                    (currentLot) =>
                        currentLot.id ===
                        canonicalRootId
                );


            const closedContainer =
                rootIsClosed
                    ? rootLot
                    : closedLots[0];


            if (!closedContainer) {

                throw new Error(
                    "No se ha podido determinar el segmento cerrado del lote."
                );

            }


            const closedContainerRef =
                doc(
                    db,
                    "homes",
                    homeId,
                    "inventoryLots",
                    closedContainer.id
                );


            const closedContainerData = {
                productId,

                quantity:
                    closedQuantity,

                expirationDate:
                    normalizeInventoryDate(
                        rootLot.expirationDate
                    ),

                openingDate:
                    "",

                origin:
                    String(
                        rootLot.origin
                        || closedContainer.origin
                        || "manual"
                    ),
            };


            if (
                closedContainer.id !==
                canonicalRootId
            ) {

                closedContainerData.splitFromLotId =
                    canonicalRootId;

            }


            transaction.set(
                closedContainerRef,
                closedContainerData,
                {
                    merge:
                        true,
                }
            );


            for (
                const currentLot
                of closedLots
            ) {

                if (
                    currentLot.id !==
                    closedContainer.id
                ) {

                    transaction.delete(
                        doc(
                            db,
                            "homes",
                            homeId,
                            "inventoryLots",
                            currentLot.id
                        )
                    );

                }

            }


            if (
                product.openingDate
            ) {

                transaction.update(
                    productRef,
                    {
                        openingDate:
                            "",
                    }
                );

            }


            return {
                productId,

                lotId,

                sourceLotId:
                    canonicalRootId,

                restoredQuantity:
                    closedQuantity,

                familyFullyClosed:
                    false,

                closedSegments:
                    1,

                openedSegments:
                    openedLots.length,
            };

        }
    );

}



/*
 * CONSUMIR UNA UNIDAD DE STOCK FÍSICO
 *
 * G.8A.1
 *
 * Motor transaccional todavía NO conectado
 * a ProductCard.
 *
 * Prioridad de consumo:
 *
 * 1. Segmentos abiertos.
 *    - primero el que tenga antes su plazo
 *      de consumo tras apertura.
 *
 * 2. Segmentos sin abrir.
 *    - primero el que caduque antes.
 *
 * 3. Si no hay una fecha comparable,
 *    se utiliza el stock más antiguo.
 *
 * Mantiene atómicamente:
 *
 * - inventoryLots
 * - inventory.quantity
 * - movementHistory
 *
 * No cambia todavía:
 *
 * - isOutOfStock
 * - quantityBeforeOutOfStock
 * - Shopping
 *
 * Esas responsabilidades pertenecen a G.8B.
 *
 * lotIds debe contener los IDs de todos los
 * lotes efectivos que la UI conoce para el
 * producto. La transacción comprueba que su
 * suma coincide con inventory.quantity antes
 * de consumir nada.
 */

function getInventoryLotCreatedAtMillis(
    lot
) {

    const createdAt =
        lot?.createdAt;


    if (
        createdAt
        && typeof createdAt.toMillis ===
            "function"
    ) {

        return createdAt.toMillis();

    }


    if (
        createdAt
        && typeof createdAt.seconds ===
            "number"
    ) {

        return (
            createdAt.seconds * 1000
            + Math.floor(
                Number(
                    createdAt.nanoseconds || 0
                ) / 1000000
            )
        );

    }


    return Number.MAX_SAFE_INTEGER;

}


function getInventoryLotOpeningDeadline(
    lot,
    daysAfterOpening
) {

    const openingDate =
        normalizeInventoryDate(
            lot?.openingDate
        );


    const numericDays =
        Number(
            daysAfterOpening
        );


    if (
        !openingDate
        || !Number.isInteger(
            numericDays
        )
        || numericDays < 1
    ) {

        return "";

    }


    const [
        year,
        month,
        day,
    ] =
        openingDate
            .split("-")
            .map(Number);


    if (
        !Number.isInteger(year)
        || !Number.isInteger(month)
        || !Number.isInteger(day)
    ) {

        return "";

    }


    const deadline =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day + numericDays
            )
        );


    const deadlineYear =
        deadline
            .getUTCFullYear();

    const deadlineMonth =
        String(
            deadline.getUTCMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const deadlineDay =
        String(
            deadline.getUTCDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${deadlineYear}-${deadlineMonth}-${deadlineDay}`
    );

}


function compareInventoryLotsForConsumption(
    lotA,
    lotB,
    daysAfterOpening
) {

    const openingDateA =
        normalizeInventoryDate(
            lotA?.openingDate
        );

    const openingDateB =
        normalizeInventoryDate(
            lotB?.openingDate
        );


    const isOpenedA =
        Boolean(
            openingDateA
        );

    const isOpenedB =
        Boolean(
            openingDateB
        );


    /*
     * Unidades abiertas siempre primero.
     */
    if (
        isOpenedA !==
        isOpenedB
    ) {

        return isOpenedA
            ? -1
            : 1;

    }


    /*
     * ABIERTAS:
     * plazo tras apertura más próximo.
     */
    if (
        isOpenedA
        && isOpenedB
    ) {

        const deadlineA =
            getInventoryLotOpeningDeadline(
                lotA,
                daysAfterOpening
            );

        const deadlineB =
            getInventoryLotOpeningDeadline(
                lotB,
                daysAfterOpening
            );


        if (
            deadlineA
            && deadlineB
            && deadlineA !== deadlineB
        ) {

            return deadlineA.localeCompare(
                deadlineB
            );

        }


        if (
            Boolean(deadlineA) !==
            Boolean(deadlineB)
        ) {

            return deadlineA
                ? -1
                : 1;

        }


        /*
         * Si daysAfterOpening no permite
         * calcular plazo, una apertura más
         * antigua tiene prioridad.
         */
        if (
            openingDateA !==
            openingDateB
        ) {

            return openingDateA.localeCompare(
                openingDateB
            );

        }

    }


    /*
     * CERRADAS:
     * caducidad más próxima.
     */
    if (
        !isOpenedA
        && !isOpenedB
    ) {

        const expirationDateA =
            normalizeInventoryDate(
                lotA?.expirationDate
            );

        const expirationDateB =
            normalizeInventoryDate(
                lotB?.expirationDate
            );


        if (
            expirationDateA
            && expirationDateB
            && expirationDateA !==
                expirationDateB
        ) {

            return expirationDateA.localeCompare(
                expirationDateB
            );

        }


        if (
            Boolean(expirationDateA) !==
            Boolean(expirationDateB)
        ) {

            return expirationDateA
                ? -1
                : 1;

        }

    }


    /*
     * Desempate:
     * stock físico más antiguo.
     */
    const createdAtDifference =
        getInventoryLotCreatedAtMillis(
            lotA
        )
        -
        getInventoryLotCreatedAtMillis(
            lotB
        );


    if (
        createdAtDifference !== 0
    ) {

        return createdAtDifference;

    }


    return String(
        lotA?.id || ""
    ).localeCompare(
        String(
            lotB?.id || ""
        )
    );

}


async function consumeProductStockFromLots(
    homeId,
    productId,
    lotIds = []
) {

    if (
        !homeId
        || !productId
    ) {

        throw new Error(
            "No se puede consumir stock sin homeId y productId."
        );

    }


    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );


    const movementRef =
        doc(
            collection(
                db,
                "homes",
                homeId,
                "movementHistory"
            )
        );


    const requestedLotIds =
        Array.isArray(
            lotIds
        )
            ? lotIds
            : [];


    const uniqueLotIds =
        Array.from(
            new Set(
                requestedLotIds
                    .map(
                        (lotId) =>
                            String(
                                lotId || ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        );


    return await runTransaction(
        db,
        async (transaction) => {

            /*
             * PRIMERA FASE:
             * todas las lecturas antes de escribir.
             */

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "El producto del que se intenta consumir stock ya no existe."
                );

            }


            const product = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            const previousQuantity =
                getValidInventoryQuantity(
                    product.quantity
                );


            if (
                previousQuantity < 1
            ) {

                throw new Error(
                    "No hay stock disponible para consumir."
                );

            }


            if (
                product.isOutOfStock === true
            ) {

                throw new Error(
                    "No se puede consumir stock de un producto marcado como agotado."
                );

            }


            const currentStrategy =
                product.usesLots === true
                    ? product.lotStrategy
                    : null;


            if (
                currentStrategy
                && currentStrategy !== "legacy"
                && currentStrategy !== "multi"
            ) {

                throw new Error(
                    "El producto utiliza una estrategia de lotes no compatible con el consumo."
                );

            }


            const expectedLegacyLotId =
                `legacy-${productId}`;


            /*
             * Un producto todavía virtual necesita
             * igualmente representar su único lote
             * efectivo en esta operación.
             */
            const effectiveLotIds =
                uniqueLotIds.length > 0
                    ? uniqueLotIds
                    : (
                        product.usesLots !== true
                        || product.lotStrategy === "legacy"
                    )
                        ? [
                            expectedLegacyLotId,
                        ]
                        : [];


            if (
                effectiveLotIds.length < 1
            ) {

                throw new Error(
                    "No se han recibido los lotes físicos necesarios para consumir el producto."
                );

            }


            const lotRefs =
                effectiveLotIds.map(
                    (lotId) =>
                        doc(
                            db,
                            "homes",
                            homeId,
                            "inventoryLots",
                            lotId
                        )
                );


            const lotSnapshots = [];


            for (
                const lotRef
                of lotRefs
            ) {

                lotSnapshots.push(
                    await transaction.get(
                        lotRef
                    )
                );

            }


            const physicalLots = [];


            lotSnapshots.forEach(
                (
                    lotSnapshot,
                    index
                ) => {

                    if (
                        !lotSnapshot.exists()
                    ) {

                        return;

                    }


                    const lot = {
                        id:
                            lotSnapshot.id,

                        ...lotSnapshot.data(),
                    };


                    if (
                        lot.productId !==
                        productId
                    ) {

                        throw new Error(
                            "Uno de los lotes recibidos no pertenece al producto indicado."
                        );

                    }


                    physicalLots.push({
                        ...lot,

                        ref:
                            lotRefs[
                                index
                            ],
                    });

                }
            );


            /*
             * Compatibilidad con producto legacy
             * todavía virtual.
             */
            if (
                physicalLots.length === 0
                && (
                    product.usesLots !== true
                    || product.lotStrategy === "legacy"
                )
                && effectiveLotIds.length === 1
                && effectiveLotIds[0] ===
                    expectedLegacyLotId
            ) {

                physicalLots.push({
                    id:
                        expectedLegacyLotId,

                    ref:
                        getLegacyInventoryLotRef(
                            homeId,
                            productId
                        ),

                    productId,

                    quantity:
                        previousQuantity,

                    expirationDate:
                        normalizeInventoryDate(
                            product.expirationDate
                        ),

                    openingDate:
                        normalizeInventoryDate(
                            product.openingDate
                        ),

                    origin:
                        "legacy",

                    isVirtual:
                        true,
                });

            }


            const lotsQuantity =
                calculateInventoryLotsQuantity(
                    physicalLots
                );


            /*
             * Protección contra una vista obsoleta
             * o una desincronización:
             *
             * nunca consumimos si la suma de los
             * lotes recibidos no coincide con el
             * agregado actual del producto.
             */
            if (
                lotsQuantity !==
                previousQuantity
            ) {

                throw new Error(
                    "El stock del producto ha cambiado. Actualiza el inventario antes de volver a consumir una unidad."
                );

            }


            const consumableLots =
                physicalLots
                    .filter(
                        (lot) =>
                            getValidInventoryQuantity(
                                lot.quantity
                            ) > 0
                    )
                    .sort(
                        (
                            lotA,
                            lotB
                        ) =>
                            compareInventoryLotsForConsumption(
                                lotA,
                                lotB,
                                product.daysAfterOpening
                            )
                    );


            const selectedLot =
                consumableLots[0];


            if (!selectedLot) {

                throw new Error(
                    "No existe ningún lote con unidades disponibles para consumir."
                );

            }


            const selectedLotQuantity =
                getValidInventoryQuantity(
                    selectedLot.quantity
                );


            const remainingLotQuantity =
                selectedLotQuantity
                - 1;


            const newQuantity =
                previousQuantity
                - 1;


            /*
             * SEGUNDA FASE:
             * escrituras atómicas.
             */

            if (
                remainingLotQuantity > 0
            ) {

                if (
                    selectedLot.isVirtual
                ) {

                    transaction.set(
                        selectedLot.ref,
                        {
                            productId,

                            quantity:
                                remainingLotQuantity,

                            expirationDate:
                                normalizeInventoryDate(
                                    selectedLot.expirationDate
                                ),

                            openingDate:
                                normalizeInventoryDate(
                                    selectedLot.openingDate
                                ),

                            createdAt:
                                serverTimestamp(),

                            origin:
                                String(
                                    selectedLot.origin
                                    || "legacy"
                                ),
                        }
                    );

                } else {

                    transaction.update(
                        selectedLot.ref,
                        {
                            quantity:
                                remainingLotQuantity,
                        }
                    );

                }

            } else if (
                !selectedLot.isVirtual
            ) {

                transaction.delete(
                    selectedLot.ref
                );

            }


            const productUpdate = {
                quantity:
                    newQuantity,
            };
            const becameOutOfStock =
                product.lotStrategy === "multi"
                && newQuantity === 0;

            /*
             * La última unidad se ha consumido de verdad.
             * No guardamos un snapshot restaurable de lotes.
             */
            if (becameOutOfStock) {
                productUpdate.isOutOfStock =
                    true;
                productUpdate.quantityBeforeOutOfStock =
                    0;
                productUpdate.outOfStockShoppingItemId =
                    "";
                productUpdate.lotsBeforeOutOfStock =
                    null;
                productUpdate.outOfStockReason =
                    "consumed";
            }


            /*
             * Si el producto aún era completamente
             * virtual, la primera consumición que
             * deja stock lo materializa como legacy.
             *
             * No lo convertimos a multi sin motivo.
             */
            if (
                product.usesLots !== true
            ) {

                productUpdate.usesLots =
                    true;

                productUpdate.lotStrategy =
                    "legacy";

            }


            transaction.update(
                productRef,
                productUpdate
            );


            transaction.set(
                movementRef,
                {
                    productId,

                    productName:
                        product.name || "",

                    type:
                        "decrease",

                    quantityChange:
                        -1,

                    previousQuantity,

                    newQuantity,

                    createdAt:
                        serverTimestamp(),

                    lotId:
                        selectedLot.id,
                }
            );


            return {
                productId,

                consumedLotId:
                    selectedLot.id,

                consumedFromOpenedLot:
                    Boolean(
                        normalizeInventoryDate(
                            selectedLot.openingDate
                        )
                    ),

                previousQuantity,

                newQuantity,

                previousLotQuantity:
                    selectedLotQuantity,

                remainingLotQuantity,

                lotDeleted:
                    remainingLotQuantity === 0,
                becameOutOfStock,

                changed:
                    true,
            };

        }
    );

}


async function updateInventoryLot(
    homeId,
    lotId,
    data
) {

    const lotRef =
        doc(
            db,
            "homes",
            homeId,
            "inventoryLots",
            lotId
        );


    await updateDoc(
        lotRef,
        data
    );

}


async function deleteInventoryLot(
    homeId,
    lotId
) {

    const lotRef =
        doc(
            db,
            "homes",
            homeId,
            "inventoryLots",
            lotId
        );


    await deleteDoc(
        lotRef
    );

}


/*
 * G.8B.1: agotado manual y deshacer para productos multi.
 * Conservamos los documentos completos para restaurar los mismos lotes,
 * incluidas fechas, antigüedad y relaciones de apertura parcial.
 * Este motor todavía no está conectado a ProductCard ni a Shopping.
 */
function validateMultiStockQuantity(value) {
    const quantity = Number(value);
    if (value == null || !Number.isSafeInteger(quantity) || quantity < 0) {
        throw new Error("La cantidad del stock no es válida.");
    }
    return quantity;
}

function validateMultiStockProduct(product) {
    if (product.usesLots !== true || product.lotStrategy !== "multi") {
        throw new Error("Esta operación requiere un producto con estrategia multi.");
    }
}

function validateMultiStockLotIds(lotIds) {
    if (!Array.isArray(lotIds) || lotIds.some(id =>
        typeof id !== "string" || !id.trim() || id.includes("/")
    )) {
        throw new Error("La lista de lotes no es válida.");
    }
    const ids = [...new Set(lotIds)];
    if (ids.length > 200) {
        throw new Error("Hay demasiados segmentos para agotar el producto en una sola operación.");
    }
    return ids;
}


/*
 * ELIMINAR PRODUCTO MULTI
 *
 * Elimina en una única transacción el producto raíz y todos los lotes
 * físicos que lo referencian. Si el producto conserva el identificador de
 * una compra creada por Agotado, solo se borra cuando sus metadatos siguen
 * demostrando que pertenece a ese producto.
 *
 * movementHistory es histórico y se conserva.
 */

async function deleteMultiProductWithLots(homeId, productId, lotIds = []) {
    if (!homeId || !productId) {
        throw new Error("No se puede eliminar el producto sin homeId y productId.");
    }

    const productRef = doc(db, "homes", homeId, "inventory", productId);
    const ids = validateMultiStockLotIds(lotIds);

    return await runTransaction(db, async transaction => {
        const productSnapshot = await transaction.get(productRef);
        if (!productSnapshot.exists()) {
            return {
                deleted: false,
                deletedLots: 0,
                deletedShoppingItem: false,
            };
        }

        const product = productSnapshot.data();
        validateMultiStockProduct(product);

        // Al estar Agotado, los ids del snapshot describen el stock anterior;
        // sus documentos físicos ya se retiraron al agotar el producto.
        const physicalLotIds = product.isOutOfStock === true ? [] : ids;
        const lots = [];
        for (const lotId of physicalLotIds) {
            const lotRef = doc(
                db,
                "homes",
                homeId,
                "inventoryLots",
                lotId
            );
            const lotSnapshot = await transaction.get(lotRef);
            if (!lotSnapshot.exists()) {
                throw new Error("Los lotes han cambiado. Actualiza el inventario antes de eliminar.");
            }
            const lot = lotSnapshot.data();
            if (lot.productId !== productId) {
                throw new Error("Uno de los lotes no pertenece al producto.");
            }
            lots.push({
                id: lotId,
                ref: lotRef,
                quantity: validateMultiStockQuantity(lot.quantity),
            });
        }

        if (product.isOutOfStock !== true) {
            const totalQuantity = lots.reduce((total, lot) => total + lot.quantity, 0);
            if (totalQuantity !== validateMultiStockQuantity(product.quantity)) {
                throw new Error("Los lotes han cambiado. Actualiza el inventario antes de eliminar.");
            }
        }

        let shoppingRef = null;
        if (product.outOfStockShoppingItemId) {
            const candidateRef = doc(
                db,
                "homes",
                homeId,
                "shoppingList",
                product.outOfStockShoppingItemId
            );
            const shoppingSnapshot = await transaction.get(candidateRef);

            if (shoppingSnapshot.exists()) {
                const shoppingItem = shoppingSnapshot.data();
                if (
                    shoppingItem.source === "outOfStock"
                    && shoppingItem.sourceProductId === productId
                ) {
                    shoppingRef = candidateRef;
                }
            }
        }

        const writeCount = lots.length + 1 + (shoppingRef ? 1 : 0);
        if (writeCount > 500) {
            throw new Error("El producto tiene demasiados lotes para eliminarse de una sola vez.");
        }

        lots.forEach(lot => {
            transaction.delete(lot.ref);
        });

        if (shoppingRef) {
            transaction.delete(shoppingRef);
        }

        transaction.delete(productRef);

        return {
            deleted: true,
            deletedLots: lots.length,
            deletedShoppingItem: Boolean(shoppingRef),
        };
    });
}

async function markMultiProductOutOfStockWithLots(homeId, productId, lotIds = []) {
    if (!homeId || !productId) {
        throw new Error("No se puede marcar agotado sin homeId y productId.");
    }
    const ids = validateMultiStockLotIds(lotIds);
    const productRef = doc(db, "homes", homeId, "inventory", productId);
    const movementRef = doc(collection(db, "homes", homeId, "movementHistory"));

    return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists()) {
            throw new Error("El producto ya no existe.");
        }
        const product = snapshot.data();
        validateMultiStockProduct(product);
        const previousQuantity = validateMultiStockQuantity(product.quantity);
        if (product.isOutOfStock === true) {
            if (previousQuantity !== 0) {
                throw new Error("El producto agotado conserva stock. Revisa el inventario.");
            }
            return {
                previousQuantity: validateMultiStockQuantity(product.quantityBeforeOutOfStock ?? 0),
                newQuantity: 0,
                changed: false,
            };
        }

        const savedLots = [];
        for (const id of ids) {
            const ref = doc(db, "homes", homeId, "inventoryLots", id);
            const lotSnapshot = await transaction.get(ref);
            if (!lotSnapshot.exists()) {
                throw new Error("Los lotes han cambiado. Actualiza el inventario.");
            }
            const data = lotSnapshot.data();
            if (data.productId !== productId) {
                throw new Error("Uno de los lotes no pertenece al producto.");
            }
            validateMultiStockQuantity(data.quantity);
            savedLots.push({ id, data });
        }
        const total = savedLots.reduce((sum, lot) => sum + Number(lot.data.quantity), 0);
        if (total !== previousQuantity) {
            throw new Error("El stock ha cambiado. Actualiza el inventario antes de marcar agotado.");
        }
        // Leave ample room for the other fields within Firestore's document limit.
        if (new TextEncoder().encode(JSON.stringify(savedLots)).length > 600000) {
            throw new Error("Los datos de los lotes son demasiado grandes para guardar la recuperación.");
        }

        for (const lot of savedLots) {
            transaction.delete(doc(db, "homes", homeId, "inventoryLots", lot.id));
        }
        transaction.update(productRef, {
            quantity: 0,
            isOutOfStock: true,
            quantityBeforeOutOfStock: previousQuantity,
            outOfStockShoppingItemId: "",
            lotsBeforeOutOfStock: savedLots,
        });
        if (previousQuantity > 0) {
            transaction.set(movementRef, {
                productId,
                productName: product.name || "",
                type: "decrease",
                quantityChange: -previousQuantity,
                previousQuantity,
                newQuantity: 0,
                createdAt: serverTimestamp(),
            });
        }
        return { previousQuantity, newQuantity: 0, changed: true };
    });
}

async function reactivateMultiProductWithLots(homeId, { productId }) {
    if (!homeId || !productId) {
        throw new Error("No se puede reactivar sin homeId y productId.");
    }
    const productRef = doc(db, "homes", homeId, "inventory", productId);
    const movementRef = doc(collection(db, "homes", homeId, "movementHistory"));

    return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists()) {
            throw new Error("El producto ya no existe.");
        }
        const product = snapshot.data();
        validateMultiStockProduct(product);
        const currentQuantity = validateMultiStockQuantity(product.quantity);
        if (product.isOutOfStock !== true) {
            return { restoredQuantity: currentQuantity, changed: false };
        }
        if (currentQuantity !== 0) {
            throw new Error("El stock ha cambiado. Actualiza el inventario antes de reactivar.");
        }
        if (
            product.outOfStockReason === "consumed"
        ) {
            let shoppingRef = null;
            if (product.outOfStockShoppingItemId) {
                const ref = doc(db, "homes", homeId, "shoppingList", product.outOfStockShoppingItemId);
                const shoppingSnapshot = await transaction.get(ref);
                if (shoppingSnapshot.exists()) {
                    const item = shoppingSnapshot.data();
                    if (item.source !== "outOfStock" || item.sourceProductId !== productId) {
                        throw new Error("La compra vinculada ha cambiado. Revisa la lista antes de reactivar.");
                    }
                    shoppingRef = ref;
                }
            }
            transaction.update(productRef, {
                quantity: 0,
                isOutOfStock: false,
                quantityBeforeOutOfStock: null,
                outOfStockShoppingItemId: "",
                lotsBeforeOutOfStock: null,
                outOfStockReason: null,
            });
            if (shoppingRef) {
                transaction.delete(shoppingRef);
            }
            return {
                restoredQuantity: 0,
                changed: true,
                restoredConsumedOutOfStock: true,
            };
        }

        const savedLots = product.lotsBeforeOutOfStock;
        const restoredQuantity = validateMultiStockQuantity(product.quantityBeforeOutOfStock);
        if (!Array.isArray(savedLots) || restoredQuantity === 0 || savedLots.length === 0) {
            throw new Error("No hay stock anterior que recuperar. Añade una nueva compra.");
        }
        const ids = validateMultiStockLotIds(savedLots.map(lot => lot?.id));
        if (ids.length !== savedLots.length) {
            throw new Error("La recuperación contiene lotes duplicados.");
        }
        let total = 0;
        for (const lot of savedLots) {
            if (lot.data?.productId !== productId) {
                throw new Error("Los lotes guardados no corresponden al producto.");
            }
            total += validateMultiStockQuantity(lot.data.quantity);
            const existing = await transaction.get(doc(db, "homes", homeId, "inventoryLots", lot.id));
            if (existing.exists()) {
                throw new Error("Uno de los lotes ya existe. Actualiza el inventario antes de reactivar.");
            }
        }
        if (total !== restoredQuantity) {
            throw new Error("La cantidad guardada no coincide con los lotes que se van a recuperar.");
        }

        // Only remove a linked shopping entry when it still belongs to this product.
        let shoppingRef = null;
        if (product.outOfStockShoppingItemId) {
            const ref = doc(db, "homes", homeId, "shoppingList", product.outOfStockShoppingItemId);
            const shoppingSnapshot = await transaction.get(ref);
            if (shoppingSnapshot.exists()) {
                const item = shoppingSnapshot.data();
                if (item.source !== "outOfStock" || item.sourceProductId !== productId) {
                    throw new Error("La compra vinculada ha cambiado. Revisa la lista antes de reactivar.");
                }
                shoppingRef = ref;
            }
        }

        for (const lot of savedLots) {
            transaction.set(doc(db, "homes", homeId, "inventoryLots", lot.id), lot.data);
        }
        transaction.update(productRef, {
            quantity: restoredQuantity,
            isOutOfStock: false,
            quantityBeforeOutOfStock: null,
            outOfStockShoppingItemId: "",
            lotsBeforeOutOfStock: null,
        });
        if (shoppingRef) transaction.delete(shoppingRef);
        transaction.set(movementRef, {
            productId,
            productName: product.name || "",
            type: "increase",
            quantityChange: restoredQuantity,
            previousQuantity: 0,
            newQuantity: restoredQuantity,
            createdAt: serverTimestamp(),
        });
        return { restoredQuantity, changed: true };
    });
}


export {
    deleteMultiProductWithLots,
    markMultiProductOutOfStockWithLots,
    reactivateMultiProductWithLots,
    getInventoryLotsCollection,
    getLegacyInventoryLotRef,
    addInventoryLot,
    getHomeInventoryLots,
    getProductInventoryLots,
    createLegacyInventoryLot,
    materializeLegacyProductLots,
    updateLegacyProductQuantityWithLots,
    updateLegacyProductOpeningWithLots,
    updateLegacyProductWithLots,
    markLegacyProductOutOfStockWithLots,
    reactivateLegacyProductWithLots,
    deleteLegacyProductWithLots,
    getEffectiveProductLots,
    groupInventoryLotsByProduct,
    calculateInventoryLotsQuantity,
    getProductLotsSummary,
    addProductStockAsNewLot,
    splitInventoryLotForOpening,
    undoInventoryLotOpening,
    consumeProductStockFromLots,
    updateInventoryLot,
    deleteInventoryLot,
};
