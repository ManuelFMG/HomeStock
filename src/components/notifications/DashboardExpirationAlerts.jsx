import {
    useEffect,
    useRef,
} from "react";

import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Typography,
} from "@mui/material";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";

import {
    Link,
} from "react-router-dom";

import useNotifications from "../../hooks/useNotifications";


function DashboardExpirationAlerts() {

    const {
        products,
        inventoryLots,
        pendingInvitations,
        loading,
        loadingInvitations,
        error,
        invitationError,
        refreshNotifications,
    } = useNotifications();

    const initialRefreshSkipped =
        useRef(false);


    useEffect(() => {

        if (
            !initialRefreshSkipped.current
        ) {

            initialRefreshSkipped.current =
                true;

            return;

        }


        refreshNotifications();

    }, [
        refreshNotifications,
    ]);


    const millisecondsPerDay =
        1000
        * 60
        * 60
        * 24;


    function getTodayAsUtc() {

        const today =
            new Date();


        return Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

    }


    function getDateAsUtc(
        dateString
    ) {

        if (
            !dateString
            || dateString === "--"
        ) {
            return null;
        }


        const parts =
            dateString.split("-");


        if (
            parts.length !== 3
        ) {
            return null;
        }


        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]);

        const day =
            Number(parts[2]);


        if (
            !Number.isInteger(year)
            || !Number.isInteger(month)
            || !Number.isInteger(day)
        ) {
            return null;
        }


        const date =
            Date.UTC(
                year,
                month - 1,
                day
            );


        if (
            Number.isNaN(date)
        ) {
            return null;
        }


        return date;

    }


    function getDaysUntilExpiration(
        expirationDate
    ) {

        const expirationDateUtc =
            getDateAsUtc(
                expirationDate
            );


        if (
            expirationDateUtc === null
        ) {
            return null;
        }


        const todayUtc =
            getTodayAsUtc();


        return Math.round(
            (
                expirationDateUtc
                - todayUtc
            )
            / millisecondsPerDay
        );

    }


    function getOpeningDeadline(
        openingDate,
        daysAfterOpening
    ) {

        const openingDateUtc =
            getDateAsUtc(
                openingDate
            );


        const numericDaysAfterOpening =
            Number(
                daysAfterOpening
            );


        if (
            openingDateUtc === null
            || !Number.isInteger(
                numericDaysAfterOpening
            )
            || numericDaysAfterOpening < 1
        ) {
            return null;
        }


        return (
            openingDateUtc
            + (
                numericDaysAfterOpening
                * millisecondsPerDay
            )
        );

    }


    function getDaysUntilOpeningDeadline(
        openingDate,
        daysAfterOpening
    ) {

        const openingDeadlineUtc =
            getOpeningDeadline(
                openingDate,
                daysAfterOpening
            );


        if (
            openingDeadlineUtc === null
        ) {
            return null;
        }


        const todayUtc =
            getTodayAsUtc();


        return Math.round(
            (
                openingDeadlineUtc
                - todayUtc
            )
            / millisecondsPerDay
        );

    }


    function formatDate(
        dateString
    ) {

        if (
            !dateString
            || dateString === "--"
        ) {
            return "--";
        }


        const parts =
            dateString.split("-");


        if (
            parts.length !== 3
        ) {
            return dateString;
        }


        const [
            year,
            month,
            day,
        ] = parts;


        return `${day}/${month}/${year}`;

    }


    function formatUtcDate(
        dateUtc
    ) {

        if (
            dateUtc === null
            || dateUtc === undefined
        ) {
            return "--";
        }


        const date =
            new Date(dateUtc);


        const day =
            String(
                date.getUTCDate()
            ).padStart(
                2,
                "0"
            );


        const month =
            String(
                date.getUTCMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const year =
            date.getUTCFullYear();


        return `${day}/${month}/${year}`;

    }


    /*
     * PRODUCTOS AGOTADOS
     */

    const outOfStockProducts =
        products
            .filter(
                (product) =>
                    product.isOutOfStock
            )
            .sort(
                (
                    productA,
                    productB
                ) =>
                    String(
                        productA.name || ""
                    ).localeCompare(
                        String(
                            productB.name || ""
                        ),
                        "es",
                        {
                            sensitivity:
                                "base",
                        }
                    )
            );


    /*
     * AVISOS DE CADUCIDAD
     *
     * G.7G.3
     *
     * Para productos con lotes físicos,
     * la caducidad pertenece al lote físico
     * de compra/stock.
     *
     * Las aperturas parciales pueden dividir
     * ese mismo lote en varios segmentos.
     * Por eso agrupamos por familia canónica:
     *
     * splitFromLotId || lot.id
     *
     * Así una apertura parcial NO duplica
     * el aviso de caducidad del mismo lote.
     *
     * Si un producto todavía no tiene ningún
     * inventoryLot físico, conservamos el
     * comportamiento legacy mediante
     * product.expirationDate.
     */

    const expirationAlerts =
        products
            .filter(
                (product) => {

                    if (
                        product.storage ===
                        "Mueble de limpieza"
                    ) {
                        return false;
                    }


                    if (
                        product.isOutOfStock
                    ) {
                        return false;
                    }


                    return true;

                }
            )
            .flatMap(
                (product) => {

                    const physicalLots =
                        inventoryLots.filter(
                            (lot) =>
                                lot.productId
                                === product.id
                        );


                    if (
                        physicalLots.length > 0
                    ) {

                        const lotFamilies =
                            physicalLots.reduce(
                                (
                                    accumulator,
                                    lot
                                ) => {

                                    const familyId =
                                        lot.splitFromLotId
                                        || lot.id;


                                    if (
                                        !accumulator[
                                        familyId
                                        ]
                                    ) {

                                        accumulator[
                                            familyId
                                        ] = {
                                            familyId,

                                            quantity:
                                                0,

                                            expirationDate:
                                                "",
                                        };

                                    }


                                    accumulator[
                                        familyId
                                    ].quantity +=
                                        Number(
                                            lot.quantity
                                        ) || 0;


                                    if (
                                        !accumulator[
                                            familyId
                                        ].expirationDate
                                        &&
                                        lot.expirationDate
                                        &&
                                        lot.expirationDate
                                        !== "--"
                                    ) {

                                        accumulator[
                                            familyId
                                        ].expirationDate =
                                            lot.expirationDate;

                                    }


                                    return accumulator;

                                },
                                {}
                            );


                        return Object.values(
                            lotFamilies
                        )
                            .filter(
                                (lotFamily) =>
                                    lotFamily.quantity > 0
                                    &&
                                    Boolean(
                                        lotFamily.expirationDate
                                    )
                                    &&
                                    lotFamily.expirationDate
                                    !== "--"
                            )
                            .map(
                                (lotFamily) => ({
                                    ...product,

                                    alertId:
                                        `${product.id}::expiration::${lotFamily.familyId}`,

                                    expirationDate:
                                        lotFamily.expirationDate,

                                    lotQuantity:
                                        lotFamily.quantity,

                                    daysUntilExpiration:
                                        getDaysUntilExpiration(
                                            lotFamily.expirationDate
                                        ),
                                })
                            );

                    }


                    /*
                     * Compatibilidad legacy:
                     * todavía no hay lotes físicos.
                     */
                    if (
                        !product.expirationDate
                        || product.expirationDate === "--"
                    ) {
                        return [];
                    }


                    return [
                        {
                            ...product,

                            alertId:
                                `${product.id}::expiration::legacy`,

                            lotQuantity:
                                Number(
                                    product.quantity
                                ) || 0,

                            daysUntilExpiration:
                                getDaysUntilExpiration(
                                    product.expirationDate
                                ),
                        },
                    ];

                }
            )
            .filter(
                (product) =>
                    product.daysUntilExpiration
                    !== null
            )
            .sort(
                (
                    productA,
                    productB
                ) => {

                    if (
                        productA.daysUntilExpiration
                        !==
                        productB.daysUntilExpiration
                    ) {

                        return (
                            productA.daysUntilExpiration
                            -
                            productB.daysUntilExpiration
                        );

                    }


                    return String(
                        productA.name || ""
                    ).localeCompare(
                        String(
                            productB.name || ""
                        ),
                        "es",
                        {
                            sensitivity:
                                "base",
                        }
                    );

                }
            );


    const expiredProducts =
        expirationAlerts.filter(
            (product) =>
                product.daysUntilExpiration
                < 0
        );


    const productsExpiringToday =
        expirationAlerts.filter(
            (product) =>
                product.daysUntilExpiration
                === 0
        );


    const productsExpiringSoon =
        expirationAlerts.filter(
            (product) =>
                product.daysUntilExpiration
                >= 1
                &&
                product.daysUntilExpiration
                <= 3
        );


    /*
     * AVISOS POR APERTURA
     *
     * G.7G.2
     *
     * Para productos que ya tienen lotes físicos,
     * la fecha de apertura pertenece al lote/segmento.
     *
     * Si todavía no existe ningún lote físico para
     * el producto, conservamos compatibilidad legacy
     * utilizando product.openingDate.
     */

    const lotsByProductId =
        inventoryLots.reduce(
            (
                accumulator,
                lot
            ) => {

                if (
                    !lot
                    || !lot.productId
                ) {
                    return accumulator;
                }


                if (
                    !accumulator[
                    lot.productId
                    ]
                ) {
                    accumulator[
                        lot.productId
                    ] = [];
                }


                accumulator[
                    lot.productId
                ].push(
                    lot
                );


                return accumulator;

            },
            {}
        );


    const openedProductsWithDeadline =
        products
            .filter(
                (product) =>
                    !product.isOutOfStock
            )
            .flatMap(
                (product) => {

                    const numericDaysAfterOpening =
                        Number(
                            product.daysAfterOpening
                        );


                    if (
                        !Number.isInteger(
                            numericDaysAfterOpening
                        )
                        || numericDaysAfterOpening < 1
                    ) {
                        return [];
                    }


                    const physicalLots =
                        lotsByProductId[
                        product.id
                        ] || [];


                    /*
                     * Si existen lotes físicos,
                     * son la fuente de verdad.
                     *
                     * Esto evita duplicar el aviso
                     * usando también openingDate
                     * del documento raíz.
                     */
                    if (
                        physicalLots.length > 0
                    ) {

                        return physicalLots
                            .filter(
                                (lot) =>
                                    Boolean(
                                        lot.openingDate
                                    )
                                    && lot.openingDate
                                    !== "--"
                                    && Number(
                                        lot.quantity
                                    ) > 0
                            )
                            .map(
                                (lot) => {

                                    const openingDeadlineUtc =
                                        getOpeningDeadline(
                                            lot.openingDate,
                                            product.daysAfterOpening
                                        );


                                    return {
                                        ...product,

                                        alertId:
                                            `${product.id}::${lot.id}`,

                                        lotId:
                                            lot.id,

                                        lotQuantity:
                                            Number(
                                                lot.quantity
                                            ) || 0,

                                        openingDate:
                                            lot.openingDate,

                                        openingDeadlineUtc,

                                        daysUntilOpeningDeadline:
                                            getDaysUntilOpeningDeadline(
                                                lot.openingDate,
                                                product.daysAfterOpening
                                            ),
                                    };

                                }
                            );

                    }


                    /*
                     * Compatibilidad legacy:
                     * producto que todavía no ha
                     * materializado inventoryLots.
                     */
                    if (
                        !product.openingDate
                        || product.openingDate === "--"
                    ) {
                        return [];
                    }


                    const openingDeadlineUtc =
                        getOpeningDeadline(
                            product.openingDate,
                            product.daysAfterOpening
                        );


                    return [
                        {
                            ...product,

                            alertId:
                                `${product.id}::legacy`,

                            lotId:
                                "",

                            lotQuantity:
                                Number(
                                    product.quantity
                                ) || 0,

                            openingDeadlineUtc,

                            daysUntilOpeningDeadline:
                                getDaysUntilOpeningDeadline(
                                    product.openingDate,
                                    product.daysAfterOpening
                                ),
                        },
                    ];

                }
            )
            .filter(
                (product) =>
                    product.openingDeadlineUtc
                    !== null
                    &&
                    product.daysUntilOpeningDeadline
                    !== null
            )
            .sort(
                (
                    productA,
                    productB
                ) => {

                    if (
                        productA.daysUntilOpeningDeadline
                        !==
                        productB.daysUntilOpeningDeadline
                    ) {

                        return (
                            productA.daysUntilOpeningDeadline
                            -
                            productB.daysUntilOpeningDeadline
                        );

                    }


                    return String(
                        productA.name || ""
                    ).localeCompare(
                        String(
                            productB.name || ""
                        ),
                        "es",
                        {
                            sensitivity:
                                "base",
                        }
                    );

                }
            );


    const openedProductsOverdue =
        openedProductsWithDeadline.filter(
            (product) =>
                product.daysUntilOpeningDeadline
                < 0
        );


    const openedProductsDueToday =
        openedProductsWithDeadline.filter(
            (product) =>
                product.daysUntilOpeningDeadline
                === 0
        );


    const openedProductsDueSoon =
        openedProductsWithDeadline.filter(
            (product) =>
                product.daysUntilOpeningDeadline
                >= 1
                &&
                product.daysUntilOpeningDeadline
                <= 3
        );


    /*
     * TOTAL DE AVISOS
     */

    const totalAlerts =
        expiredProducts.length
        + productsExpiringToday.length
        + productsExpiringSoon.length
        + openedProductsOverdue.length
        + openedProductsDueToday.length
        + openedProductsDueSoon.length
        + outOfStockProducts.length
        + pendingInvitations.length;


    const isLoading =
        loading
        || loadingInvitations;


    function renderExpirationProducts(
        alertProducts
    ) {

        return (

            <Box
                sx={{
                    mt: 1,
                }}
            >

                {alertProducts.map(
                    (product) => (

                        <Typography
                            key={
                                product.alertId
                                || product.id
                            }
                            variant="body2"
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            • {product.name}
                            {" — "}
                            {formatDate(
                                product.expirationDate
                            )}
                            {product.lotQuantity > 0
                                ? ` — ${product.lotQuantity} ${product.lotQuantity === 1
                                    ? "unidad"
                                    : "unidades"
                                }`
                                : ""}
                        </Typography>

                    )
                )}

            </Box>

        );

    }


    function renderOpenedProducts(
        alertProducts
    ) {

        return (

            <Box
                sx={{
                    mt: 1,
                }}
            >

                {alertProducts.map(
                    (product) => (

                        <Typography
                            key={
                                product.alertId
                                || product.id
                            }
                            variant="body2"
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            • {product.name}
                            {" — abierto: "}
                            {formatDate(
                                product.openingDate
                            )}
                            {product.lotQuantity > 0
                                ? ` — ${product.lotQuantity} ${product.lotQuantity === 1
                                    ? "unidad"
                                    : "unidades"
                                }`
                                : ""}
                            {" — consumir antes de: "}
                            {formatUtcDate(
                                product.openingDeadlineUtc
                            )}
                        </Typography>

                    )
                )}

            </Box>

        );

    }


    function renderOutOfStockProducts() {

        return (

            <Box
                sx={{
                    mt: 1,
                }}
            >

                {outOfStockProducts.map(
                    (product) => (

                        <Typography
                            key={
                                product.id
                            }
                            variant="body2"
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            • {product.name}
                        </Typography>

                    )
                )}

            </Box>

        );

    }


    return (

        <Card
            sx={{
                borderRadius: 3,
                mt: 4,
            }}
        >

            <CardContent>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: {
                            xs: "flex-start",
                            sm: "center",
                        },
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        gap: 2,
                        mb: 3,
                    }}
                >

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >

                        <WarningAmberIcon
                            color={
                                totalAlerts > 0
                                    ? "warning"
                                    : "primary"
                            }
                        />


                        <Box>

                            <Typography
                                variant="h6"
                                fontWeight="bold"
                            >
                                Avisos del hogar
                            </Typography>


                            {!isLoading
                                && !error
                                && !invitationError
                                && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {totalAlerts === 0
                                            ? "No tienes avisos pendientes."
                                            : `${totalAlerts} ${totalAlerts === 1
                                                ? "aviso pendiente"
                                                : "avisos pendientes"
                                            }`}
                                    </Typography>
                                )}

                        </Box>

                    </Box>


                    <Button
                        component={Link}
                        to="/inventory"
                        variant="outlined"
                        startIcon={
                            <Inventory2Icon />
                        }
                    >
                        Ver inventario
                    </Button>

                </Box>


                {isLoading && (

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            py: 2,
                        }}
                    >

                        <CircularProgress
                            size={22}
                        />


                        <Typography
                            color="text.secondary"
                        >
                            Comprobando avisos...
                        </Typography>

                    </Box>

                )}


                {!isLoading
                    && error
                    && (

                        <Alert
                            severity="error"
                            sx={{
                                mb:
                                    invitationError
                                        ? 2
                                        : 0,
                            }}
                        >
                            {error}
                        </Alert>

                    )}


                {!isLoading
                    && invitationError
                    && (

                        <Alert
                            severity="error"
                        >
                            {invitationError}
                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && !invitationError
                    && totalAlerts === 0
                    && (

                        <Alert
                            severity="success"
                        >
                            Todo correcto. No tienes productos agotados, caducados, próximos a caducar, avisos pendientes por productos abiertos ni invitaciones pendientes.
                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && !invitationError
                    && pendingInvitations.length > 0
                    && (

                        <Alert
                            severity="info"
                            icon={
                                <MarkEmailUnreadIcon />
                            }
                            sx={{
                                mb: 2,
                            }}
                        >

                            <AlertTitle>
                                Invitaciones pendientes
                            </AlertTitle>


                            {pendingInvitations.length === 1
                                ? "Tienes 1 invitación pendiente para unirte a un hogar."
                                : `Tienes ${pendingInvitations.length} invitaciones pendientes para unirte a hogares.`}


                            <Box
                                sx={{
                                    mt: 1.5,
                                }}
                            >

                                {pendingInvitations.map(
                                    (invitation) => (

                                        <Typography
                                            key={
                                                invitation.id
                                            }
                                            variant="body2"
                                            sx={{
                                                mt: 0.5,
                                            }}
                                        >
                                            •{" "}
                                            {invitation.homeName
                                                || "Mi Hogar"}
                                            {invitation.ownerEmail
                                                ? ` — ${invitation.ownerEmail}`
                                                : ""}
                                        </Typography>

                                    )
                                )}

                            </Box>


                            <Button
                                component={Link}
                                to="/settings"
                                size="small"
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                }}
                            >
                                Ver invitaciones
                            </Button>

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && expiredProducts.length > 0
                    && (

                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                            }}
                        >

                            <AlertTitle>
                                Productos caducados
                            </AlertTitle>


                            {expiredProducts.length === 1
                                ? "Hay 1 producto caducado."
                                : `Hay ${expiredProducts.length} productos caducados.`}


                            {renderExpirationProducts(
                                expiredProducts
                            )}

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && productsExpiringToday.length > 0
                    && (

                        <Alert
                            severity="warning"
                            sx={{
                                mb: 2,
                            }}
                        >

                            <AlertTitle>
                                Caducan hoy
                            </AlertTitle>


                            {productsExpiringToday.length === 1
                                ? "Hay 1 producto que caduca hoy."
                                : `Hay ${productsExpiringToday.length} productos que caducan hoy.`}


                            {renderExpirationProducts(
                                productsExpiringToday
                            )}

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && productsExpiringSoon.length > 0
                    && (

                        <Alert
                            severity="info"
                            sx={{
                                mb: 2,
                            }}
                        >

                            <AlertTitle>
                                Próximos a caducar
                            </AlertTitle>


                            {productsExpiringSoon.length === 1
                                ? "Hay 1 producto que caduca en los próximos 3 días."
                                : `Hay ${productsExpiringSoon.length} productos que caducan en los próximos 3 días.`}


                            {renderExpirationProducts(
                                productsExpiringSoon
                            )}

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && openedProductsOverdue.length > 0
                    && (

                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                            }}
                        >

                            <AlertTitle>
                                Plazo tras apertura superado
                            </AlertTitle>


                            {openedProductsOverdue.length === 1
                                ? "Hay 1 producto que ha superado su duración indicada después de abrirlo."
                                : `Hay ${openedProductsOverdue.length} productos que han superado su duración indicada después de abrirlos.`}


                            {renderOpenedProducts(
                                openedProductsOverdue
                            )}

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && openedProductsDueToday.length > 0
                    && (

                        <Alert
                            severity="warning"
                            sx={{
                                mb: 2,
                            }}
                        >

                            <AlertTitle>
                                Consumir hoy
                            </AlertTitle>


                            {openedProductsDueToday.length === 1
                                ? "Hay 1 producto abierto cuyo plazo termina hoy."
                                : `Hay ${openedProductsDueToday.length} productos abiertos cuyo plazo termina hoy.`}


                            {renderOpenedProducts(
                                openedProductsDueToday
                            )}

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && openedProductsDueSoon.length > 0
                    && (

                        <Alert
                            severity="info"
                            sx={{
                                mb:
                                    outOfStockProducts.length > 0
                                        ? 2
                                        : 0,
                            }}
                        >

                            <AlertTitle>
                                Productos abiertos próximos a consumir
                            </AlertTitle>


                            {openedProductsDueSoon.length === 1
                                ? "Hay 1 producto abierto cuyo plazo termina en los próximos 3 días."
                                : `Hay ${openedProductsDueSoon.length} productos abiertos cuyo plazo termina en los próximos 3 días.`}


                            {renderOpenedProducts(
                                openedProductsDueSoon
                            )}

                        </Alert>

                    )}


                {!isLoading
                    && !error
                    && outOfStockProducts.length > 0
                    && (

                        <Alert
                            severity="error"
                        >

                            <AlertTitle>
                                Productos agotados
                            </AlertTitle>


                            {outOfStockProducts.length === 1
                                ? "Hay 1 producto agotado."
                                : `Hay ${outOfStockProducts.length} productos agotados.`}


                            {renderOutOfStockProducts()}

                        </Alert>

                    )}

            </CardContent>

        </Card>

    );

}


export default DashboardExpirationAlerts;