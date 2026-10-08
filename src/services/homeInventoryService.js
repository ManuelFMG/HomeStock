import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    serverTimestamp,
    runTransaction,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
    getLegacyInventoryLotRef,
    deleteLegacyProductWithLots,
    deleteMultiProductWithLots,
} from "./inventoryLotService";


function getInventoryCollection(homeId) {

    return collection(
        db,
        "homes",
        homeId,
        "inventory"
    );

}


async function addHomeProduct(
    homeId,
    product
) {

    return await addDoc(
        getInventoryCollection(homeId),
        {
            ...product,
            createdAt: serverTimestamp(),
        }
    );

}


async function getHomeProducts(homeId) {

    const snapshot = await getDocs(
        getInventoryCollection(homeId)
    );

    return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
    }));

}


/*
 * NORMALIZAR IDENTIDAD DE PRODUCTO
 */

function normalizeInventoryProductName(
    productName
) {

    return String(
        productName || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase();

}


function inventoryProductsMatch(
    productA,
    productB
) {

    if (
        !productA
        || !productB
    ) {
        return false;
    }


    const normalizedNameA =
        normalizeInventoryProductName(
            productA.name
        );

    const normalizedNameB =
        normalizeInventoryProductName(
            productB.name
        );


    if (
        !normalizedNameA
        || !normalizedNameB
    ) {
        return false;
    }


    if (
        normalizedNameA
        !== normalizedNameB
    ) {
        return false;
    }


    const storageA =
        String(
            productA.storage || ""
        ).trim();

    const storageB =
        String(
            productB.storage || ""
        ).trim();


    return storageA === storageB;

}


function findMatchingInventoryProduct(
    products,
    productToFind
) {

    if (
        !Array.isArray(products)
        || !productToFind
    ) {
        return null;
    }


    return (
        products.find(
            (product) =>
                inventoryProductsMatch(
                    product,
                    productToFind
                )
        )
        || null
    );

}


async function findMatchingHomeProduct(
    homeId,
    productToFind
) {

    if (
        !homeId
        || !productToFind
    ) {
        return null;
    }


    const products =
        await getHomeProducts(
            homeId
        );


    return findMatchingInventoryProduct(
        products,
        productToFind
    );

}


function getInventoryProductQuantity(
    product
) {

    const quantity =
        Number(
            product?.quantity
        );


    if (
        !Number.isInteger(quantity)
        || quantity < 0
    ) {
        return 0;
    }


    return quantity;

}


function calculateInventoryQuantityAfterAddition(
    product,
    quantityToAdd
) {

    const currentQuantity =
        getInventoryProductQuantity(
            product
        );

    const addedQuantity =
        Number(
            quantityToAdd
        );


    if (
        !Number.isInteger(
            addedQuantity
        )
        || addedQuantity < 1
    ) {

        throw new Error(
            "La cantidad a añadir al inventario debe ser un número entero mayor que cero."
        );

    }


    return (
        currentQuantity
        + addedQuantity
    );

}


function normalizeInventoryDate(
    value
) {

    if (
        !value
        || value === "--"
    ) {
        return "";
    }


    return value;

}


/*
 * ACTUALIZACIÓN COMPATIBLE CON LOTES
 *
 * Conservamos la firma histórica de:
 *
 * updateHomeProduct(
 *     homeId,
 *     productId,
 *     data
 * )
 *
 * Esto permite que ProductCard y
 * ProductDialog continúen funcionando
 * sin modificar su interfaz.
 *
 * La diferencia es que ahora cada
 * actualización mantiene sincronizados:
 *
 * inventory
 * +
 * inventoryLots/legacy-{productId}
 *
 * Si el producto todavía no utiliza lotes,
 * se materializa dentro de esta misma
 * transacción.
 *
 * movementHistory continúa siendo
 * responsabilidad del llamador actual.
 *
 * Así evitamos duplicar los movimientos que
 * ProductCard y ProductDialog ya registran.
 */

async function updateHomeProduct(
    homeId,
    productId,
    data
) {

    if (
        !homeId
        || !productId
        || !data
    ) {
        return;
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


    await runTransaction(
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


            const currentProduct = {
                id:
                    productSnapshot.id,

                ...productSnapshot.data(),
            };


            /*
             * CINTURÓN DE SEGURIDAD
             *
             * G.4E solamente soporta la
             * estrategia legacy.
             *
             * Cuando activemos multi-lote,
             * esta función no podrá modificar
             * silenciosamente esos productos.
             */

            if (
                currentProduct.usesLots === true
                && currentProduct.lotStrategy !== "legacy"
            ) {

                throw new Error(
                    "El producto utiliza una estrategia de lotes que esta operación todavía no puede modificar."
                );

            }


            const nextQuantityRaw =
                data.quantity !== undefined
                    ? data.quantity
                    : currentProduct.quantity;


            const nextQuantity =
                Number(
                    nextQuantityRaw
                );


            if (
                !Number.isInteger(
                    nextQuantity
                )
                || nextQuantity < 0
            ) {

                throw new Error(
                    "La cantidad del producto debe ser un número entero mayor o igual que cero."
                );

            }


            /*
             * Las fechas que no llegan en
             * data se conservan desde el
             * documento actual.
             *
             * De esta forma funcionan tanto:
             *
             * { quantity: 4 }
             *
             * como:
             *
             * { openingDate: "..." }
             *
             * y la edición completa del
             * ProductDialog.
             */

            const nextExpirationDate =
                normalizeInventoryDate(
                    data.expirationDate !== undefined
                        ? data.expirationDate
                        : currentProduct.expirationDate
                );


            const nextOpeningDate =
                normalizeInventoryDate(
                    data.openingDate !== undefined
                        ? data.openingDate
                        : currentProduct.openingDate
                );


            /*
             * Firestore exige realizar las
             * lecturas de una transacción
             * antes de comenzar sus escrituras.
             */

            let legacyLotSnapshot =
                null;


            if (
                currentProduct.usesLots === true
                && nextQuantity > 0
            ) {

                legacyLotSnapshot =
                    await transaction.get(
                        legacyLotRef
                    );

            }


            /*
             * STOCK > 0
             *
             * Debe existir exactamente un
             * lote legacy durante esta fase.
             */

            if (
                nextQuantity > 0
            ) {

                if (
                    legacyLotSnapshot
                    && legacyLotSnapshot.exists()
                ) {

                    /*
                     * Lote existente.
                     *
                     * Conservamos createdAt.
                     */

                    transaction.update(
                        legacyLotRef,
                        {
                            quantity:
                                nextQuantity,

                            expirationDate:
                                nextExpirationDate,

                            openingDate:
                                nextOpeningDate,
                        }
                    );

                } else {

                    /*
                     * Primera materialización
                     * o producto que vuelve
                     * desde quantity 0.
                     */

                    transaction.set(
                        legacyLotRef,
                        {
                            productId,

                            quantity:
                                nextQuantity,

                            expirationDate:
                                nextExpirationDate,

                            openingDate:
                                nextOpeningDate,

                            createdAt:
                                serverTimestamp(),

                            origin:
                                "legacy",
                        }
                    );

                }

            } else {

                /*
                 * No almacenamos lotes con
                 * quantity 0.
                 */

                transaction.delete(
                    legacyLotRef
                );

            }


            /*
             * Finalmente actualizamos el
             * agregado principal.
             *
             * usesLots y lotStrategy quedan
             * activados desde la primera
             * operación que pase por aquí.
             */

            transaction.update(
                productRef,
                {
                    ...data,

                    quantity:
                        nextQuantity,

                    expirationDate:
                        nextExpirationDate,

                    openingDate:
                        nextOpeningDate,

                    usesLots:
                        true,

                    lotStrategy:
                        "legacy",
                }
            );

        }
    );

}


/*
 * ELIMINACIÓN COMPATIBLE
 *
 * InventoryPage continúa llamando a:
 *
 * deleteHomeProduct()
 *
 * pero ahora la eliminación borra también
 * el lote legacy del producto.
 */

async function deleteHomeProduct(
    homeId,
    productId,
    lotIds = []
) {

    const productRef =
        doc(
            db,
            "homes",
            homeId,
            "inventory",
            productId
        );

    const productSnapshot =
        await getDoc(
            productRef
        );

    if (!productSnapshot.exists()) {
        return {
            deleted: false,
        };
    }

    const product = productSnapshot.data();

    if (
        product.usesLots === true
        && product.lotStrategy === "multi"
    ) {
        return await deleteMultiProductWithLots(
            homeId,
            productId,
            lotIds
        );
    }

    return await deleteLegacyProductWithLots(
        homeId,
        productId
    );

}


/*
 * Actualiza exclusivamente los campos comunes de un producto multi.
 * La cantidad y las fechas físicas pertenecen a inventoryLots.
 */
async function updateMultiProductCommonFields(
    homeId,
    productId,
    {
        name,
        price,
        storage,
        daysAfterOpening,
    }
) {
    if (!homeId || !productId) {
        throw new Error("No se puede actualizar un producto sin homeId y productId.");
    }
    const normalizedName = String(name || "").trim();
    const numericPrice = Number(price);
    const normalizedStorage = String(storage || "");
    const normalizedDaysAfterOpening = daysAfterOpening === ""
        ? ""
        : Number(daysAfterOpening);
    if (!normalizedName || Number.isNaN(numericPrice) || numericPrice < 0 || !normalizedStorage) {
        throw new Error("Los datos comunes del producto no son válidos.");
    }
    if (normalizedDaysAfterOpening !== "" && (!Number.isInteger(normalizedDaysAfterOpening) || normalizedDaysAfterOpening < 1)) {
        throw new Error("La duración tras apertura no es válida.");
    }
    const productRef = doc(db, "homes", homeId, "inventory", productId);
    await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists()) {
            throw new Error("El producto que se intenta actualizar ya no existe.");
        }
        const product = snapshot.data();
        if (product.usesLots !== true || product.lotStrategy !== "multi") {
            throw new Error("Esta actualización requiere un producto con estrategia multi.");
        }
        transaction.update(productRef, {
            name: normalizedName,
            price: numericPrice,
            storage: normalizedStorage,
            daysAfterOpening: normalizedDaysAfterOpening,

            // La edición común nunca puede degradar un producto multi
            // al flujo legacy ni modificar su stock físico.
            usesLots: true,
            lotStrategy: "multi",
        });
    });
}

export {
    getInventoryCollection,
    addHomeProduct,
    getHomeProducts,
    normalizeInventoryProductName,
    inventoryProductsMatch,
    findMatchingInventoryProduct,
    findMatchingHomeProduct,
    getInventoryProductQuantity,
    calculateInventoryQuantityAfterAddition,
    updateHomeProduct,
    updateMultiProductCommonFields,
    deleteHomeProduct,
};
