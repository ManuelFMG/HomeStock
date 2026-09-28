import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    serverTimestamp,
    arrayUnion,
} from "firebase/firestore";

import { db } from "../firebase/firebase";


const invitationsCollection =
    collection(
        db,
        "homeInvitations"
    );


function normalizeEmail(email) {

    return String(
        email || ""
    )
        .trim()
        .toLowerCase();

}


function getInvitationFromDocument(
    document
) {

    return {
        id:
            document.id,

        ...document.data(),
    };

}


async function getOwnerInvitations(
    ownerId
) {

    if (!ownerId) {
        return [];
    }


    const invitationsQuery =
        query(
            invitationsCollection,

            where(
                "ownerId",
                "==",
                ownerId
            )
        );


    const snapshot =
        await getDocs(
            invitationsQuery
        );


    return snapshot.docs.map(
        getInvitationFromDocument
    );

}


async function getInvitationsByEmail(
    email
) {

    const normalizedEmail =
        normalizeEmail(
            email
        );


    if (!normalizedEmail) {
        return [];
    }


    const invitationsQuery =
        query(
            invitationsCollection,

            where(
                "invitedEmail",
                "==",
                normalizedEmail
            )
        );


    const snapshot =
        await getDocs(
            invitationsQuery
        );


    return snapshot.docs.map(
        getInvitationFromDocument
    );

}


async function getPendingInvitationsByEmail(
    email
) {

    const invitations =
        await getInvitationsByEmail(
            email
        );


    return invitations.filter(
        (invitation) =>
            invitation.status ===
            "pending"
    );

}


async function getAcceptedHomeInvitations(
    homeId
) {

    if (!homeId) {
        return [];
    }


    const invitationsQuery =
        query(
            invitationsCollection,

            where(
                "homeId",
                "==",
                homeId
            ),

            where(
                "status",
                "==",
                "accepted"
            )
        );


    const snapshot =
        await getDocs(
            invitationsQuery
        );


    return snapshot.docs.map(
        getInvitationFromDocument
    );

}


async function findPendingInvitation(
    ownerId,
    invitedEmail
) {

    const normalizedEmail =
        normalizeEmail(
            invitedEmail
        );


    if (
        !ownerId
        || !normalizedEmail
    ) {
        return null;
    }


    const invitations =
        await getOwnerInvitations(
            ownerId
        );


    return (
        invitations.find(
            (invitation) =>
                invitation.status ===
                "pending"

                && normalizeEmail(
                    invitation.invitedEmail
                ) ===
                normalizedEmail
        )
        || null
    );

}


async function createHomeInvitation({
    homeId,
    homeName,
    ownerId,
    ownerEmail,
    invitedEmail,
}) {

    const normalizedInvitedEmail =
        normalizeEmail(
            invitedEmail
        );


    const normalizedOwnerEmail =
        normalizeEmail(
            ownerEmail
        );


    if (
        !homeId
        || !ownerId
        || !normalizedInvitedEmail
    ) {

        throw new Error(
            "Los datos de la invitación no son válidos."
        );

    }


    const duplicateInvitation =
        await findPendingInvitation(
            ownerId,
            normalizedInvitedEmail
        );


    if (duplicateInvitation) {

        return {
            created:
                false,

            duplicate:
                true,

            invitation:
                duplicateInvitation,
        };

    }


    const invitationRef =
        await addDoc(
            invitationsCollection,
            {
                homeId,

                homeName:
                    homeName
                    || "Mi Hogar",

                ownerId,

                ownerEmail:
                    normalizedOwnerEmail,

                invitedEmail:
                    normalizedInvitedEmail,

                status:
                    "pending",

                createdAt:
                    serverTimestamp(),
            }
        );


    return {
        created:
            true,

        duplicate:
            false,

        invitation: {
            id:
                invitationRef.id,

            homeId,

            homeName:
                homeName
                || "Mi Hogar",

            ownerId,

            ownerEmail:
                normalizedOwnerEmail,

            invitedEmail:
                normalizedInvitedEmail,

            status:
                "pending",
        },
    };

}


async function acceptHomeInvitation(
    invitation,
    user
) {

    if (
        !invitation
        || !invitation.id
        || !invitation.homeId
        || !user
        || !user.uid
        || !user.email
    ) {

        throw new Error(
            "Los datos necesarios para aceptar la invitación no son válidos."
        );

    }


    const normalizedUserEmail =
        normalizeEmail(
            user.email
        );


    const normalizedInvitedEmail =
        normalizeEmail(
            invitation.invitedEmail
        );


    if (
        normalizedUserEmail !==
        normalizedInvitedEmail
    ) {

        throw new Error(
            "La invitación no pertenece al usuario actual."
        );

    }


    if (
        invitation.status !==
        "pending"
    ) {

        throw new Error(
            "La invitación ya no está pendiente."
        );

    }


    const batch =
        writeBatch(db);


    const invitationRef =
        doc(
            db,
            "homeInvitations",
            invitation.id
        );


    const homeRef =
        doc(
            db,
            "homes",
            invitation.homeId
        );


    const userProfileRef =
        doc(
            db,
            "userProfiles",
            user.uid
        );


    batch.update(
        invitationRef,
        {
            status:
                "accepted",

            respondedAt:
                serverTimestamp(),

            acceptedBy:
                user.uid,
        }
    );


    batch.update(
        homeRef,
        {
            members:
                arrayUnion(
                    user.uid
                ),

            lastAcceptedInvitationId:
                invitation.id,
        }
    );


    batch.set(
        userProfileRef,
        {
            activeHomeId:
                invitation.homeId,

            email:
                normalizedUserEmail,

            updatedAt:
                serverTimestamp(),
        },
        {
            merge: true,
        }
    );


    await batch.commit();


    return {
        homeId:
            invitation.homeId,
    };

}


async function rejectHomeInvitation(
    invitation,
    user
) {

    if (
        !invitation
        || !invitation.id
        || !user
        || !user.email
    ) {

        throw new Error(
            "Los datos necesarios para rechazar la invitación no son válidos."
        );

    }


    const normalizedUserEmail =
        normalizeEmail(
            user.email
        );


    const normalizedInvitedEmail =
        normalizeEmail(
            invitation.invitedEmail
        );


    if (
        normalizedUserEmail !==
        normalizedInvitedEmail
    ) {

        throw new Error(
            "La invitación no pertenece al usuario actual."
        );

    }


    if (
        invitation.status !==
        "pending"
    ) {

        throw new Error(
            "La invitación ya no está pendiente."
        );

    }


    const batch =
        writeBatch(db);


    const invitationRef =
        doc(
            db,
            "homeInvitations",
            invitation.id
        );


    batch.update(
        invitationRef,
        {
            status:
                "rejected",

            respondedAt:
                serverTimestamp(),

            acceptedBy:
                null,
        }
    );


    await batch.commit();

}


export {
    normalizeEmail,
    getOwnerInvitations,
    getInvitationsByEmail,
    getPendingInvitationsByEmail,
    getAcceptedHomeInvitations,
    findPendingInvitation,
    createHomeInvitation,
    acceptHomeInvitation,
    rejectHomeInvitation,
};