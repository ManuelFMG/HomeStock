import {
    Box,
    Button,
    MenuItem,
    TextField,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";


function ShoppingForm({
    productName,
    onProductNameChange,

    quantity,
    onQuantityChange,

    storage,
    onStorageChange,
    storageError,

    onSubmit,
    saving,
}) {

    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "2fr 1fr",
                    md: "2fr 1fr 1.5fr auto",
                },
                gap: 2,
                alignItems: "center",
            }}
        >

            <TextField
                label="Producto"
                value={productName}
                onChange={(event) =>
                    onProductNameChange(
                        event.target.value
                    )
                }
                disabled={saving}
                fullWidth
            />


            <TextField
                label="Cantidad"
                type="text"
                value={quantity}
                onChange={onQuantityChange}
                disabled={saving}
                slotProps={{
                    htmlInput: {
                        inputMode: "numeric",
                    },
                }}
                fullWidth
            />


            <TextField
                select
                label="Ubicación"
                value={storage}
                onChange={(event) =>
                    onStorageChange(
                        event.target.value
                    )
                }
                disabled={saving}
                error={storageError}
                helperText={
                    storageError
                        ? "Selecciona una ubicación."
                        : ""
                }
                fullWidth
            >

                <MenuItem value="">
                    Selecciona una ubicación
                </MenuItem>

                <MenuItem value="Nevera">
                    Nevera
                </MenuItem>

                <MenuItem value="Congelador">
                    Congelador
                </MenuItem>

                <MenuItem value="Despensa">
                    Despensa
                </MenuItem>

                <MenuItem value="Mueble de limpieza">
                    Mueble de limpieza
                </MenuItem>

            </TextField>


            <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={saving}
                sx={{
                    minHeight: 56,
                }}
            >
                Añadir
            </Button>

        </Box>
    );
}


export default ShoppingForm;