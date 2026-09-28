import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";


function getUserProfileReference(
    userId
) {

    return doc(
        db,
        "userProfiles",
        userId
    );

}


async function getUserProfile(
    userId
) {

    if (!userId) {
        return null;
    }


    const profileRef =
        getUserProfileReference(
            userId
        );


    const snapshot =
        await getDoc(
            profileRef
        );


    if (!snapshot.exists()) {
        return null;
    }


    return {
        id:
            snapshot.id,

        ...snapshot.data(),
    };

}


async function createOrUpdateUserProfile(
    userId,
    data
) {

    if (!userId) {

        throw new Error(
            "El usuario no es válido."
        );

    }


    const profileRef =
        getUserProfileReference(
            userId
        );


    await setDoc(
        profileRef,
        {
            ...data,

            updatedAt:
                serverTimestamp(),
        },
        {
            merge: true,
        }
    );

}


async function setActiveHome(
    userId,
    homeId
) {

    if (
        !userId
        || !homeId
    ) {

        throw new Error(
            "No se puede establecer el hogar activo."
        );

    }


    await createOrUpdateUserProfile(
        userId,
        {
            activeHomeId:
                homeId,
        }
    );

}


export {
    getUserProfileReference,
    getUserProfile,
    createOrUpdateUserProfile,
    setActiveHome,
};