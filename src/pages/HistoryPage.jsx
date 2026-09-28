import {
    useEffect,
    useState,
} from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import useHome from "../hooks/useHome";

import PageContainer from "../components/layout/PageContainer";
import PageTitle from "../components/layout/PageTitle";
import SectionCard from "../components/layout/SectionCard";
import BackToHomeButton from "../components/layout/BackToHomeButton";

import {
    getMovementHistory,
} from "../services/movementHistoryService";


function HistoryPage() {

    const [movements, setMovements] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [filter, setFilter] = useState("all");

    const [searchTerm, setSearchTerm] = useState("");

    const { home } = useHome();


    useEffect(() => {

        async function loadMovements() {

            if (!home) {

                setMovements([]);
                setLoading(false);

                return;
            }

            try {

                setLoading(true);
                setError("");

                const data = await getMovementHistory(
                    home.id
                );

                setMovements(data);

            } catch (error) {

                console.error(
                    "Error al cargar el historial:",
                    error
                );

                setError(
                    "No se ha podido cargar el historial."
                );

            } finally {

                setLoading(false);

            }

        }

        loadMovements();

    }, [home]);


    function formatDate(timestamp) {

        if (!timestamp) {
            return "--";
        }

        const date = timestamp.toDate();

        return new Intl.DateTimeFormat(
            "es-ES",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(date);

    }


    function normalizeText(text) {

        return String(text || "")
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase();

    }


    const normalizedSearch =
        normalizeText(
            searchTerm.trim()
        );


    const filteredMovements = movements.filter(
        (movement) => {

            const matchesType =
                filter === "all"
                || (
                    filter === "increase"
                    && movement.type === "increase"
                )
                || (
                    filter === "decrease"
                    && movement.type === "decrease"
                );


            const matchesSearch =
                !normalizedSearch
                || normalizeText(
                    movement.productName
                ).includes(
                    normalizedSearch
                );


            return (
                matchesType
                && matchesSearch
            );

        }
    );


    const searchIsActive =
        searchTerm.trim() !== "";


    function clearSearch() {

        setSearchTerm("");

    }


    return (
        <PageContainer>

            <BackToHomeButton />

            <PageTitle>
                Historial
            </PageTitle>

            <SectionCard>


                {!loading
                    && !error
                    && movements.length > 0 && (

                        <>

                            <TextField
                                fullWidth
                                label="Buscar producto"
                                placeholder="Ejemplo: leche, café, yogur..."
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment
                                                position="start"
                                            >
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),

                                        endAdornment:
                                            searchTerm ? (
                                                <InputAdornment
                                                    position="end"
                                                >
                                                    <IconButton
                                                        edge="end"
                                                        onClick={
                                                            clearSearch
                                                        }
                                                        aria-label="Limpiar búsqueda"
                                                    >
                                                        <ClearIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                    },
                                }}
                                sx={{
                                    mb: 2,
                                }}
                            />


                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    mb: 2,
                                }}
                            >

                                <Button
                                    variant={
                                        filter === "all"
                                            ? "contained"
                                            : "outlined"
                                    }
                                    onClick={() =>
                                        setFilter("all")
                                    }
                                >
                                    Todos
                                </Button>

                                <Button
                                    variant={
                                        filter === "increase"
                                            ? "contained"
                                            : "outlined"
                                    }
                                    onClick={() =>
                                        setFilter("increase")
                                    }
                                >
                                    Entradas
                                </Button>

                                <Button
                                    variant={
                                        filter === "decrease"
                                            ? "contained"
                                            : "outlined"
                                    }
                                    onClick={() =>
                                        setFilter("decrease")
                                    }
                                >
                                    Salidas
                                </Button>

                            </Box>


                            {searchIsActive && (

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 3,
                                    }}
                                >
                                    {
                                        filteredMovements.length
                                    }{" "}
                                    {
                                        filteredMovements.length === 1
                                            ? "movimiento encontrado"
                                            : "movimientos encontrados"
                                    }
                                </Typography>

                            )}

                        </>

                    )}


                {loading && (

                    <Typography
                        color="text.secondary"
                    >
                        Cargando historial...
                    </Typography>

                )}


                {!loading && error && (

                    <Typography
                        color="error"
                    >
                        {error}
                    </Typography>

                )}


                {!loading
                    && !error
                    && movements.length === 0 && (

                        <Typography
                            color="text.secondary"
                        >
                            No hay movimientos registrados.
                        </Typography>

                    )}


                {!loading
                    && !error
                    && movements.length > 0
                    && filteredMovements.length === 0 && (

                        <Typography
                            color="text.secondary"
                        >
                            {searchIsActive
                                ? `No hay movimientos que coincidan con "${searchTerm.trim()}".`
                                : "No hay movimientos para este filtro."}
                        </Typography>

                    )}


                {!loading
                    && !error
                    && filteredMovements.length > 0 && (

                        filteredMovements.map((movement) => (

                            <Box
                                key={movement.id}
                                sx={{
                                    mb: 2,
                                    pb: 2,
                                    borderBottom:
                                        "1px solid #e0e0e0",
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                >
                                    {movement.productName}
                                </Typography>

                                <Typography>
                                    {movement.type === "increase"
                                        ? "Entrada"
                                        : "Salida"}
                                </Typography>

                                <Typography>
                                    Cantidad:{" "}
                                    {movement.quantityChange > 0
                                        ? `+${movement.quantityChange}`
                                        : movement.quantityChange}
                                </Typography>

                                <Typography>
                                    De{" "}
                                    {movement.previousQuantity}
                                    {" "}a{" "}
                                    {movement.newQuantity}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {formatDate(
                                        movement.createdAt
                                    )}
                                </Typography>

                            </Box>

                        ))

                    )}

            </SectionCard>

        </PageContainer>
    );
}


export default HistoryPage;