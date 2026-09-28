import {
    createContext,
    useEffect,
    useState,
} from "react";

import useAuth from "../hooks/useAuth";

import {
    getHomeById,
    getHomeByUser,
} from "../services/homeService";

import {
    getUserProfile,
    createOrUpdateUserProfile,
} from "../services/userProfileService";


const HomeContext =
    createContext(null);


export function HomeProvider({
    children,
}) {

    const [home, setHome] =
        useState(null);


    const [loading, setLoading] =
        useState(true);


    const { user } =
        useAuth();


    useEffect(() => {

        let cancelled =
            false;


        async function tryLoadHomeById(
            homeId
        ) {

            if (!homeId) {
                return null;
            }


            try {

                return await getHomeById(
                    homeId
                );

            } catch (error) {

                /*
                 * Si el usuario ya no pertenece
                 * al hogar, Firestore devolverá
                 * permission-denied.
                 *
                 * No es un error fatal:
                 * simplemente debemos intentar
                 * cargar otro hogar.
                 */
                if (
                    error.code ===
                    "permission-denied"
                ) {
                    return null;
                }


                throw error;

            }

        }


        async function loadHome() {

            if (!user) {

                if (!cancelled) {

                    setHome(null);

                    setLoading(false);

                }


                return;

            }


            try {

                if (!cancelled) {

                    setLoading(true);

                }


                const profile =
                    await getUserProfile(
                        user.uid
                    );


                /*
                 * 1. HOGAR ACTIVO
                 */

                if (
                    profile?.activeHomeId
                ) {

                    const activeHome =
                        await tryLoadHomeById(
                            profile.activeHomeId
                        );


                    if (activeHome) {

                        if (!cancelled) {

                            setHome(
                                activeHome
                            );

                        }


                        return;

                    }

                }


                /*
                 * 2. HOGAR PERSONAL
                 *
                 * Si activeHomeId ya no es
                 * accesible porque el propietario
                 * ha retirado al usuario,
                 * recuperamos su hogar personal.
                 */

                if (
                    profile?.personalHomeId
                    && profile.personalHomeId !==
                    profile.activeHomeId
                ) {

                    const personalHome =
                        await tryLoadHomeById(
                            profile.personalHomeId
                        );


                    if (personalHome) {

                        await createOrUpdateUserProfile(
                            user.uid,
                            {
                                activeHomeId:
                                    personalHome.id,

                                email:
                                    user.email || "",
                            }
                        );


                        if (!cancelled) {

                            setHome(
                                personalHome
                            );

                        }


                        return;

                    }

                }


                /*
                 * 3. COMPATIBILIDAD CON
                 * USUARIOS ANTIGUOS
                 */

                const homeData =
                    await getHomeByUser(
                        user.uid
                    );


                if (!homeData) {

                    if (!cancelled) {

                        setHome(null);

                    }


                    return;

                }


                /*
                 * 4. CREAR / ACTUALIZAR PERFIL
                 * DE USUARIO ANTIGUO
                 */

                await createOrUpdateUserProfile(
                    user.uid,
                    {
                        activeHomeId:
                            homeData.id,

                        personalHomeId:
                            homeData.ownerId ===
                                user.uid
                                ? homeData.id
                                : profile?.personalHomeId
                                || null,

                        email:
                            user.email || "",
                    }
                );


                if (!cancelled) {

                    setHome(
                        homeData
                    );

                }

            } catch (error) {

                console.error(
                    "Error al cargar el hogar:",
                    error
                );


                if (!cancelled) {

                    setHome(null);

                }

            } finally {

                if (!cancelled) {

                    setLoading(false);

                }

            }

        }


        loadHome();


        return () => {

            cancelled =
                true;

        };

    }, [user]);


    const value = {
        home,
        setHome,
        loading,
    };


    return (

        <HomeContext.Provider
            value={value}
        >
            {children}
        </HomeContext.Provider>

    );

}


export default HomeContext;