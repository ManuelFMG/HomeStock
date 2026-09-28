import { useEffect, useState } from "react";

import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography,
} from "@mui/material";

import useHome from "../../hooks/useHome";

import {
    getHomeProducts,
} from "../../services/homeInventoryService";

import { Link } from "react-router-dom";

function DashboardInventorySummary() {

    const [products, setProducts] = useState([]);

    const { home } = useHome();

    useEffect(() => {

        async function loadProducts() {

            if (!home) {
                setProducts([]);
                return;
            }

            const data = await getHomeProducts(home.id);

            setProducts(data);

        }

        loadProducts();

    }, [home]);

    const totalProducts = products.length;

    const totalUnits = products.reduce(
        (total, product) => {

            const quantity = Number(product.quantity) || 0;

            return total + quantity;

        },
        0
    );

    const totalInventoryValue = products.reduce(
        (total, product) => {

            const price = Number(product.price) || 0;
            const quantity = Number(product.quantity) || 0;

            return total + (price * quantity);

        },
        0
    );

    function formatPrice(price) {

        return `${price.toFixed(2).replace(".", ",")} €`;

    }

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, 1fr)",
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

                <CardActionArea
                    component={Link}
                    to="/inventory"
                    sx={{
                        height: "100%",
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

                </CardActionArea>

            </Card>


            <Card
                sx={{
                    borderRadius: 3,
                }}
            >

                <CardActionArea
                    component={Link}
                    to="/inventory"
                    sx={{
                        height: "100%",
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

                </CardActionArea>

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
                        {formatPrice(totalInventoryValue)}
                    </Typography>

                </CardContent>

            </Card>

        </Box>
    );
}

export default DashboardInventorySummary;