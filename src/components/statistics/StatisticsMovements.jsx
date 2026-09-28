import {
    Box,
    Card,
    CardContent,
    Divider,
    Typography,
} from "@mui/material";

function StatisticsMovements({
    movements,
}) {

    function formatDate(timestamp) {

        if (!timestamp) {
            return "--";
        }

        let date;

        if (
            timestamp.toDate
            && typeof timestamp.toDate === "function"
        ) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }

        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const year =
            date.getFullYear();

        const hours = String(
            date.getHours()
        ).padStart(2, "0");

        const minutes = String(
            date.getMinutes()
        ).padStart(2, "0");

        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    }

    function getMovementLabel(type) {

        if (type === "increase") {
            return "Entrada";
        }

        if (type === "decrease") {
            return "Salida";
        }

        return "Movimiento";
    }

    function formatQuantity(quantity) {

        const numericQuantity =
            Number(quantity) || 0;

        if (numericQuantity > 0) {
            return `+${numericQuantity}`;
        }

        return `${numericQuantity}`;
    }

    if (movements.length === 0) {

        return (
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
                        sx={{ mb: 1 }}
                    >
                        Últimos movimientos
                    </Typography>

                    <Typography
                        color="text.secondary"
                    >
                        Todavía no hay movimientos registrados.
                    </Typography>

                </CardContent>

            </Card>
        );

    }

    return (
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
                    Últimos movimientos
                </Typography>

                {movements
                    .slice(0, 10)
                    .map((movement, index) => (

                        <Box key={movement.id}>

                            <Box
                                sx={{
                                    py: 2,
                                }}
                            >

                                <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                >
                                    {movement.productName ||
                                        "Producto"}
                                </Typography>

                                <Typography>
                                    {getMovementLabel(
                                        movement.type
                                    )}
                                </Typography>

                                <Typography
                                    color={
                                        movement.type ===
                                            "increase"
                                            ? "success.main"
                                            : "error.main"
                                    }
                                >
                                    Cantidad:{" "}
                                    {formatQuantity(
                                        movement.quantityChange
                                    )}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                >
                                    De{" "}
                                    {movement.previousQuantity ??
                                        0}{" "}
                                    a{" "}
                                    {movement.newQuantity ??
                                        0}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {formatDate(
                                        movement.createdAt
                                    )}
                                </Typography>

                            </Box>

                            {index < Math.min(
                                movements.length,
                                10
                            ) - 1 && (
                                    <Divider />
                                )}

                        </Box>

                    ))}

            </CardContent>

        </Card>
    );
}

export default StatisticsMovements;