import {
    Box,
    Button,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { Link } from "react-router-dom";

function BackToDashboard() {

    return (
        <Box
            sx={{
                mb: 2,
            }}
        >
            <Button
                component={Link}
                to="/dashboard"
                startIcon={<ArrowBackIcon />}
                sx={{
                    textTransform: "none",
                    fontWeight: 600,
                }}
            >
                Inicio
            </Button>
        </Box>
    );
}

export default BackToDashboard;