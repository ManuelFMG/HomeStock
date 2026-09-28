import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography,
} from "@mui/material";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import HistoryIcon from "@mui/icons-material/History";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";

import { Link } from "react-router-dom";

function DashboardMenu() {

    const menuItems = [
        {
            title: "Inventario",
            description: "Gestiona los productos de tu hogar.",
            icon: <Inventory2Icon fontSize="large" />,
            path: "/inventory",
        },
        {
            title: "Historial",
            description: "Consulta los movimientos del inventario.",
            icon: <HistoryIcon fontSize="large" />,
            path: "/history",
        },
        {
            title: "Compras",
            description: "Gestiona tu lista de la compra.",
            icon: <ShoppingCartIcon fontSize="large" />,
            path: "/shopping",
        },
        {
            title: "Estadísticas",
            description: "Consulta los datos de tu hogar.",
            icon: <BarChartIcon fontSize="large" />,
            path: "/statistics",
        },
        {
            title: "Ajustes",
            description: "Configura tu cuenta y HomeStock.",
            icon: <SettingsIcon fontSize="large" />,
            path: "/settings",
        },
    ];

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                },
                gap: 3,
                mt: 4,
            }}
        >

            {menuItems.map((item) => (
                <Card
                    key={item.path}
                    sx={{
                        borderRadius: 3,
                    }}
                >

                    <CardActionArea
                        component={Link}
                        to={item.path}
                        sx={{
                            height: "100%",
                        }}
                    >

                        <CardContent
                            sx={{
                                p: 3,
                            }}
                        >

                            <Box
                                sx={{
                                    mb: 2,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {item.icon}
                            </Box>

                            <Typography
                                variant="h6"
                                fontWeight="bold"
                            >
                                {item.title}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 1,
                                }}
                            >
                                {item.description}
                            </Typography>

                        </CardContent>

                    </CardActionArea>

                </Card>
            ))}

        </Box>
    );
}

export default DashboardMenu;