import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";


function getMovementHistoryCollection(homeId) {

    return collection(
        db,
        "homes",
        homeId,
        "movementHistory"
    );

}


async function addMovement(
    homeId,
    movement
) {

    return await addDoc(
        getMovementHistoryCollection(homeId),
        {
            ...movement,
            createdAt: serverTimestamp(),
        }
    );

}


async function getMovementHistory(homeId) {

    const movementQuery = query(
        getMovementHistoryCollection(homeId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(
        movementQuery
    );

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

}


export {
    getMovementHistoryCollection,
    addMovement,
    getMovementHistory,
};