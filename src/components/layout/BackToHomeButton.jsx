import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";

function BackToHomeButton() {

    return (
        <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
            sx={{
                mb: 3,
                color: "primary.main",
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "1rem",
            }}
        >
            Inicio
        </Button>
    );

}

export default BackToHomeButton;