import { db } from "../firebase/firebase";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    updateDoc,
    arrayRemove,
    writeBatch,
    serverTimestamp,
} from "firebase/firestore";


const homesCollection = collection(
    db,
    "homes"
);


async function createHome(
    homeData
) {

    return await addDoc(
        homesCollection,
        homeData
    );

}


async function getHomes() {

    const snapshot =
        await getDocs(
            homesCollection
        );


    return snapshot.docs.map(
        (document) => ({
            id:
                document.id,

            ...document.data(),
        })
    );

}


function getHomeFromSnapshot(
    snapshot
) {

    if (snapshot.empty) {
        return null;
    }


    const homeDocument =
        snapshot.docs[0];


    return {
        id:
            homeDocument.id,

        ...homeDocument.data(),
    };

}


async function getHomeById(
    homeId
) {

    if (!homeId) {
        return null;
    }


    const homeRef =
        doc(
            db,
            "homes",
            homeId
        );


    const snapshot =
        await getDoc(
            homeRef
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


/*
 * EL PROPIETARIO RETIRA
 * A OTRO MIEMBRO.
 */

async function removeHomeMember(
    homeId,
    memberId
) {

    if (
        !homeId
        || !memberId
    ) {

        throw new Error(
            "Los datos del miembro no son válidos."
        );

    }


    const homeRef =
        doc(
            db,
            "homes",
            homeId
        );


    await updateDoc(
        homeRef,
        {
            members:
                arrayRemove(
                    memberId
                ),
        }
    );

}


/*
 * UN MIEMBRO ABANDONA
 * VOLUNTARIAMENTE EL HOGAR.
 *
 * La operación es atómica:
 *
 * 1. Sale de members.
 * 2. activeHomeId vuelve a personalHomeId.
 */

async function leaveSharedHome(
    homeId,
    userId,
    personalHomeId
) {

    if (
        !homeId
        || !userId
        || !personalHomeId
    ) {

        throw new Error(
            "Los datos necesarios para abandonar el hogar no son válidos."
        );

    }


    if (
        homeId ===
        personalHomeId
    ) {

        throw new Error(
            "No puedes abandonar tu hogar personal."
        );

    }


    const homeRef =
        doc(
            db,
            "homes",
            homeId
        );


    const userProfileRef =
        doc(
            db,
            "userProfiles",
            userId
        );


    const batch =
        writeBatch(db);


    /*
     * El usuario sale del hogar compartido.
     */

    batch.update(
        homeRef,
        {
            members:
                arrayRemove(
                    userId
                ),
        }
    );


    /*
     * Su hogar personal vuelve a ser
     * el hogar activo.
     */

    batch.set(
        userProfileRef,
        {
            activeHomeId:
                personalHomeId,

            updatedAt:
                serverTimestamp(),
        },
        {
            merge: true,
        }
    );


    await batch.commit();

}


async function getHomeByUser(
    userId
) {

    if (!userId) {
        return null;
    }


    /*
     * Primero mantenemos la búsqueda
     * validada por ownerId.
     */

    const ownerQuery =
        query(
            homesCollection,

            where(
                "ownerId",
                "==",
                userId
            )
        );


    const ownerSnapshot =
        await getDocs(
            ownerQuery
        );


    const ownerHome =
        getHomeFromSnapshot(
            ownerSnapshot
        );


    if (ownerHome) {
        return ownerHome;
    }


    /*
     * Compatibilidad para usuarios que
     * pertenezcan a un hogar compartido
     * pero todavía no tengan perfil activo.
     */

    try {

        const membersQuery =
            query(
                homesCollection,

                where(
                    "members",
                    "array-contains",
                    userId
                )
            );


        const membersSnapshot =
            await getDocs(
                membersQuery
            );


        return getHomeFromSnapshot(
            membersSnapshot
        );

    } catch (error) {

        if (
            error.code ===
            "permission-denied"
        ) {
            return null;
        }


        throw error;

    }

}


export {
    db,
    homesCollection,
    createHome,
    getHomes,
    getHomeById,
    removeHomeMember,
    leaveSharedHome,
    getHomeByUser,
};