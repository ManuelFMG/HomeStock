import {
    createHome,
} from "../services/homeService";

import {
    createOrUpdateUserProfile,
} from "../services/userProfileService";


async function initializeNewUser(
    user
) {

    const homeData = {
        name:
            "Mi Hogar",

        ownerId:
            user.uid,

        members: [
            user.uid,
        ],

        createdAt:
            new Date(),
    };


    const homeRef =
        await createHome(
            homeData
        );


    await createOrUpdateUserProfile(
        user.uid,
        {
            activeHomeId:
                homeRef.id,

            personalHomeId:
                homeRef.id,

            email:
                user.email || "",
        }
    );


    return {
        user,

        homeId:
            homeRef.id,
    };

}


export {
    initializeNewUser,
};