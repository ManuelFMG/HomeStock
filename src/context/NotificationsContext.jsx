import {
    createContext,
    useCallback,
    useEffect,
    useState,
} from "react";

import useAuth from "../hooks/useAuth";
import useHome from "../hooks/useHome";

import {
    getHomeProducts,
} from "../services/homeInventoryService";

import {
    getHomeInventoryLots,
} from "../services/inventoryLotService";

import {
    getPendingInvitationsByEmail,
} from "../services/invitationService";


const NotificationsContext =
    createContext(null);


function NotificationsProvider({
    children,
}) {

    const { user } =
        useAuth();

    const { home } =
        useHome();

    const [
        products,
        setProducts,
    ] = useState([]);

    const [
        inventoryLots,
        setInventoryLots,
    ] = useState([]);

    const [
        pendingInvitations,
        setPendingInvitations,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadingInvitations,
        setLoadingInvitations,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        invitationError,
        setInvitationError,
    ] = useState("");


    const loadProducts =
        useCallback(
            async () => {

                if (!home) {

                    setProducts([]);
                    setInventoryLots([]);
                    setLoading(false);
                    setError("");

                    return;

                }

                try {

                    setLoading(true);
                    setError("");

                    const [
                        productsData,
                        lotsData,
                    ] =
                        await Promise.all([
                            getHomeProducts(
                                home.id
                            ),
                            getHomeInventoryLots(
                                home.id
                            ),
                        ]);

                    setProducts(
                        productsData
                    );

                    setInventoryLots(
                        lotsData
                    );

                } catch (error) {

                    console.error(
                        "Error al cargar los avisos del hogar:",
                        error
                    );

                    setProducts([]);
                    setInventoryLots([]);

                    setError(
                        "No se han podido cargar los avisos del hogar."
                    );

                } finally {

                    setLoading(false);

                }

            },
            [
                home,
            ]
        );


    const loadPendingInvitations =
        useCallback(
            async () => {

                if (
                    !user
                    || !user.email
                ) {

                    setPendingInvitations([]);
                    setLoadingInvitations(false);
                    setInvitationError("");

                    return;

                }

                try {

                    setLoadingInvitations(
                        true
                    );

                    setInvitationError("");

                    const data =
                        await getPendingInvitationsByEmail(
                            user.email
                        );

                    setPendingInvitations(
                        data
                    );

                } catch (error) {

                    console.error(
                        "Error al cargar las invitaciones pendientes:",
                        error
                    );

                    setPendingInvitations([]);

                    setInvitationError(
                        "No se han podido comprobar las invitaciones pendientes."
                    );

                } finally {

                    setLoadingInvitations(
                        false
                    );

                }

            },
            [
                user,
            ]
        );


    useEffect(() => {

        loadProducts();

    }, [
        loadProducts,
    ]);


    useEffect(() => {

        loadPendingInvitations();

    }, [
        loadPendingInvitations,
    ]);


    const refreshNotifications =
        useCallback(
            async () => {

                await Promise.all([
                    loadProducts(),
                    loadPendingInvitations(),
                ]);

            },
            [
                loadProducts,
                loadPendingInvitations,
            ]
        );


    const value = {
        products,
        inventoryLots,
        pendingInvitations,
        loading,
        loadingInvitations,
        error,
        invitationError,
        refreshNotifications,
    };


    return (

        <NotificationsContext.Provider
            value={value}
        >
            {children}
        </NotificationsContext.Provider>

    );

}


export {
    NotificationsContext,
    NotificationsProvider,
};
