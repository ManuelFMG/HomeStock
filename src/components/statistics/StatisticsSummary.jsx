import {
    Box,
    Card,
    CardContent,
    LinearProgress,
    Typography,
} from "@mui/material";


function StatisticsSummary({
    products,
    movements,
}) {

    const totalProducts = products.length;


    const totalUnits = products.reduce(
        (total, product) => {

            const quantity =
                Number(product.quantity) || 0;

            return total + quantity;

        },
        0
    );


    const totalInventoryValue = products.reduce(
        (total, product) => {

            const price =
                Number(product.price) || 0;

            const quantity =
                Number(product.quantity) || 0;

            return total + (price * quantity);

        },
        0
    );


    const totalMovements = movements.length;


    const totalEntries = movements.filter(
        (movement) =>
            movement.type === "increase"
    ).length;


    const totalExits = movements.filter(
        (movement) =>
            movement.type === "decrease"
    ).length;


    const totalUnitsAdded = movements.reduce(
        (total, movement) => {

            if (movement.type !== "increase") {
                return total;
            }

            const quantity =
                Number(movement.quantityChange) || 0;

            return total + Math.abs(quantity);

        },
        0
    );


    const totalUnitsRemoved = movements.reduce(
        (total, movement) => {

            if (movement.type !== "decrease") {
                return total;
            }

            const quantity =
                Number(movement.quantityChange) || 0;

            return total + Math.abs(quantity);

        },
        0
    );


    /*
     * DISTRIBUCIÓN POR UBICACIÓN
     */

    const locations = {};

    products.forEach((product) => {

        const location =
            product.storage || "Sin ubicación";

        const quantity =
            Number(product.quantity) || 0;

        const price =
            Number(product.price) || 0;

        const value =
            price * quantity;


        if (!locations[location]) {

            locations[location] = {
                units: 0,
                value: 0,
            };

        }


        locations[location].units += quantity;

        locations[location].value += value;

    });


    /*
     * PRODUCTO CON MAYOR VALOR
     */

    let mostValuableProduct = null;

    products.forEach((product) => {

        const price =
            Number(product.price) || 0;

        const quantity =
            Number(product.quantity) || 0;

        const value =
            price * quantity;


        if (
            !mostValuableProduct
            || value > mostValuableProduct.value
        ) {

            mostValuableProduct = {
                name:
                    product.name || "Producto",
                value,
                quantity,
                price,
            };

        }

    });


    /*
     * VALORES MÁXIMOS PARA LAS BARRAS
     */

    const locationValues =
        Object.values(locations);

    const maxLocationUnits =
        locationValues.length > 0
            ? Math.max(
                ...locationValues.map(
                    (location) => location.units
                )
            )
            : 0;


    const totalMovementUnits =
        totalUnitsAdded + totalUnitsRemoved;


    function formatPrice(price) {

        return `${price
            .toFixed(2)
            .replace(".", ",")} €`;

    }


    function calculatePercentage(
        value,
        total
    ) {

        if (!total) {
            return 0;
        }

        return (
            (value / total) * 100
        );

    }


    return (
        <>

            {/* RESUMEN PRINCIPAL */}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                    },
                    gap: 3,
                    mt: 4,
                }}
            >

                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Productos
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ mt: 1 }}
                        >
                            {totalProducts}
                        </Typography>

                    </CardContent>

                </Card>


                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Unidades
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ mt: 1 }}
                        >
                            {totalUnits}
                        </Typography>

                    </CardContent>

                </Card>


                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Valor del inventario
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ mt: 1 }}
                        >
                            {formatPrice(
                                totalInventoryValue
                            )}
                        </Typography>

                    </CardContent>

                </Card>

            </Box>


            {/* MOVIMIENTOS */}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                    },
                    gap: 3,
                    mt: 3,
                }}
            >

                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Movimientos
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ mt: 1 }}
                        >
                            {totalMovements}
                        </Typography>

                    </CardContent>

                </Card>


                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Entradas
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{
                                mt: 1,
                                color: "success.main",
                            }}
                        >
                            {totalEntries}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            +{totalUnitsAdded} unidades
                        </Typography>

                    </CardContent>

                </Card>


                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Salidas
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{
                                mt: 1,
                                color: "error.main",
                            }}
                        >
                            {totalExits}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            -{totalUnitsRemoved} unidades
                        </Typography>

                    </CardContent>

                </Card>


                <Card
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Ubicaciones
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            sx={{ mt: 1 }}
                        >
                            {Object.keys(locations).length}
                        </Typography>

                    </CardContent>

                </Card>

            </Box>


            {/* BALANCE DE MOVIMIENTOS */}

            <Card
                sx={{
                    borderRadius: 3,
                    mt: 3,
                }}
            >

                <CardContent>

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                    >
                        Balance de movimientos
                    </Typography>


                    {totalMovementUnits === 0 ? (

                        <Typography
                            color="text.secondary"
                        >
                            Todavía no hay movimientos
                            con cantidades registradas.
                        </Typography>

                    ) : (

                        <Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    mb: 1,
                                }}
                            >

                                <Typography
                                    color="success.main"
                                    fontWeight="bold"
                                >
                                    Entradas
                                </Typography>

                                <Typography>
                                    {totalUnitsAdded}
                                    {" "}unidades
                                </Typography>

                            </Box>


                            <LinearProgress
                                variant="determinate"
                                value={calculatePercentage(
                                    totalUnitsAdded,
                                    totalMovementUnits
                                )}
                                color="success"
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    mb: 2,
                                }}
                            />


                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    mb: 1,
                                }}
                            >

                                <Typography
                                    color="error.main"
                                    fontWeight="bold"
                                >
                                    Salidas
                                </Typography>

                                <Typography>
                                    {totalUnitsRemoved}
                                    {" "}unidades
                                </Typography>

                            </Box>


                            <LinearProgress
                                variant="determinate"
                                value={calculatePercentage(
                                    totalUnitsRemoved,
                                    totalMovementUnits
                                )}
                                color="error"
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                }}
                            />

                        </Box>

                    )}

                </CardContent>

            </Card>


            {/* INVENTARIO POR UBICACIÓN */}

            <Card
                sx={{
                    borderRadius: 3,
                    mt: 3,
                }}
            >

                <CardContent>

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                    >
                        Inventario por ubicación
                    </Typography>


                    {Object.keys(locations).length === 0 ? (

                        <Typography
                            color="text.secondary"
                        >
                            No hay productos en el inventario.
                        </Typography>

                    ) : (

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, 1fr)",
                                },
                                gap: 2,
                            }}
                        >

                            {Object.entries(locations).map(
                                ([location, data]) => (

                                    <Box
                                        key={location}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                                "background.default",
                                        }}
                                    >

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent:
                                                    "space-between",
                                                gap: 2,
                                            }}
                                        >

                                            <Typography
                                                color="text.secondary"
                                            >
                                                {location}
                                            </Typography>

                                            <Typography
                                                fontWeight="bold"
                                            >
                                                {data.units}
                                                {" "}unidades
                                            </Typography>

                                        </Box>


                                        <LinearProgress
                                            variant="determinate"
                                            value={
                                                maxLocationUnits > 0
                                                    ? (
                                                        data.units
                                                        / maxLocationUnits
                                                    ) * 100
                                                    : 0
                                            }
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                mt: 1,
                                            }}
                                        />


                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            Valor:{" "}
                                            {formatPrice(
                                                data.value
                                            )}
                                        </Typography>

                                    </Box>

                                )
                            )}

                        </Box>

                    )}

                </CardContent>

            </Card>


            {/* PRODUCTO DE MAYOR VALOR */}

            <Card
                sx={{
                    borderRadius: 3,
                    mt: 3,
                }}
            >

                <CardContent>

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                    >
                        Producto con mayor valor
                    </Typography>


                    {!mostValuableProduct ? (

                        <Typography
                            color="text.secondary"
                        >
                            No hay productos en el inventario.
                        </Typography>

                    ) : (

                        <Box>

                            <Typography
                                variant="h5"
                                fontWeight="bold"
                            >
                                {mostValuableProduct.name}
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                {mostValuableProduct.quantity}
                                {" "}unidades ×{" "}
                                {formatPrice(
                                    mostValuableProduct.price
                                )}
                            </Typography>

                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{ mt: 1 }}
                            >
                                Valor total:{" "}
                                {formatPrice(
                                    mostValuableProduct.value
                                )}
                            </Typography>

                        </Box>

                    )}

                </CardContent>

            </Card>

        </>
    );
}


export default StatisticsSummary;