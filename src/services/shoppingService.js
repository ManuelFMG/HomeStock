import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firebase";


function getShoppingCollection(homeId) {

    return collection(
        db,
        "homes",
        homeId,
        "shoppingList"
    );

}


function normalizeProductName(name) {

    return String(name || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


function getLevenshteinDistance(
    firstText,
    secondText
) {

    const first =
        normalizeProductName(
            firstText
        );

    const second =
        normalizeProductName(
            secondText
        );


    const rows =
        first.length + 1;

    const columns =
        second.length + 1;


    const matrix =
        Array.from(
            {
                length: rows,
            },
            () =>
                Array(
                    columns
                ).fill(0)
        );


    for (
        let row = 0;
        row < rows;
        row += 1
    ) {

        matrix[row][0] =
            row;

    }


    for (
        let column = 0;
        column < columns;
        column += 1
    ) {

        matrix[0][column] =
            column;

    }


    for (
        let row = 1;
        row < rows;
        row += 1
    ) {

        for (
            let column = 1;
            column < columns;
            column += 1
        ) {

            const cost =
                first[
                    row - 1
                ] ===
                    second[
                    column - 1
                    ]
                    ? 0
                    : 1;


            matrix[row][column] =
                Math.min(
                    matrix[
                    row - 1
                    ][column] + 1,

                    matrix[
                    row
                    ][
                    column - 1
                    ] + 1,

                    matrix[
                    row - 1
                    ][
                    column - 1
                    ] + cost
                );

        }

    }


    return matrix[
        rows - 1
    ][
        columns - 1
    ];

}


function getProductNameSimilarity(
    firstName,
    secondName
) {

    const first =
        normalizeProductName(
            firstName
        );

    const second =
        normalizeProductName(
            secondName
        );


    if (
        !first
        || !second
    ) {
        return 0;
    }


    if (first === second) {
        return 1;
    }


    const longestLength =
        Math.max(
            first.length,
            second.length
        );


    if (longestLength === 0) {
        return 1;
    }


    const distance =
        getLevenshteinDistance(
            first,
            second
        );


    return (
        1
        - distance
        / longestLength
    );

}


function findDuplicateShoppingItem(
    items,
    productName,
    threshold = 0.98
) {

    if (
        !Array.isArray(items)
        || !productName
    ) {
        return null;
    }


    const normalizedName =
        normalizeProductName(
            productName
        );


    if (!normalizedName) {
        return null;
    }


    const exactDuplicate =
        items.find(
            (item) =>
                normalizeProductName(
                    item.name
                ) ===
                normalizedName
        );


    if (exactDuplicate) {
        return exactDuplicate;
    }


    const similarDuplicate =
        items.find(
            (item) =>
                getProductNameSimilarity(
                    item.name,
                    productName
                ) >= threshold
        );


    return (
        similarDuplicate
        || null
    );

}


async function findDuplicateShoppingItemByHome(
    homeId,
    productName,
    threshold = 0.98
) {

    const items =
        await getShoppingItems(
            homeId
        );


    return findDuplicateShoppingItem(
        items,
        productName,
        threshold
    );

}


async function addShoppingItem(
    homeId,
    item
) {

    return await addDoc(
        getShoppingCollection(homeId),
        {
            ...item,

            createdAt:
                serverTimestamp(),
        }
    );

}


async function getShoppingItems(homeId) {

    const shoppingQuery =
        query(
            getShoppingCollection(
                homeId
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    const snapshot =
        await getDocs(
            shoppingQuery
        );


    return snapshot.docs.map(
        (document) => ({
            id:
                document.id,

            ...document.data(),
        })
    );

}


async function updateShoppingItem(
    homeId,
    itemId,
    data
) {

    const itemRef =
        doc(
            db,
            "homes",
            homeId,
            "shoppingList",
            itemId
        );


    await updateDoc(
        itemRef,
        data
    );

}


async function updateShoppingItemsPurchased(
    homeId,
    items,
    purchased
) {

    if (
        !Array.isArray(items)
        || items.length === 0
    ) {
        return;
    }


    if (items.length > 450) {

        throw new Error(
            "Hay demasiados productos para actualizarlos de una sola vez."
        );

    }


    const batch =
        writeBatch(db);


    items.forEach(
        (item) => {

            const itemRef =
                doc(
                    db,
                    "homes",
                    homeId,
                    "shoppingList",
                    item.id
                );


            batch.update(
                itemRef,
                {
                    purchased:
                        Boolean(
                            purchased
                        ),
                }
            );

        }
    );


    await batch.commit();

}


async function deleteShoppingItem(
    homeId,
    itemId
) {

    const itemRef =
        doc(
            db,
            "homes",
            homeId,
            "shoppingList",
            itemId
        );


    await deleteDoc(
        itemRef
    );

}


async function deleteShoppingItems(
    homeId,
    items
) {

    if (
        !Array.isArray(items)
        || items.length === 0
    ) {
        return;
    }


    if (items.length > 450) {

        throw new Error(
            "Hay demasiados productos para eliminarlos de una sola vez."
        );

    }


    const batch =
        writeBatch(db);


    items.forEach(
        (item) => {

            const itemRef =
                doc(
                    db,
                    "homes",
                    homeId,
                    "shoppingList",
                    item.id
                );


            batch.delete(
                itemRef
            );

        }
    );


    await batch.commit();

}


export {
    getShoppingCollection,
    normalizeProductName,
    getProductNameSimilarity,
    findDuplicateShoppingItem,
    findDuplicateShoppingItemByHome,
    addShoppingItem,
    getShoppingItems,
    updateShoppingItem,
    updateShoppingItemsPurchased,
    deleteShoppingItem,
    deleteShoppingItems,
};