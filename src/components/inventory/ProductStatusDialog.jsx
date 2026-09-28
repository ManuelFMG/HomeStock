import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";


function ProductStatusDialog({
    open,
    mode,
    productName,
    saving,
    onCancel,
    onConfirm,
}) {

    const isShoppingMode =
        mode === "shopping";


    const title =
        isShoppingMode
            ? "Producto agotado"
            : "Reactivar producto";


    const message =
        isShoppingMode
            ? `¿Quieres añadir "${productName}" a la Lista de la compra?`
            : `¿Deseas reactivar "${productName}" y deshacer el estado de agotado?`;


    return (

        <Dialog
            open={open}
            onClose={
                saving
                    ? undefined
                    : onCancel
            }
            maxWidth="xs"
            fullWidth
            disableRestoreFocus
        >

            <DialogTitle>
                {title}
            </DialogTitle>


            <DialogContent>

                <DialogContentText>
                    {message}
                </DialogContentText>

            </DialogContent>


            <DialogActions>

                <Button
                    onClick={onCancel}
                    disabled={saving}
                >
                    {isShoppingMode
                        ? "No"
                        : "Cancelar"}
                </Button>


                <Button
                    variant="contained"
                    color={
                        isShoppingMode
                            ? "primary"
                            : "success"
                    }
                    onClick={onConfirm}
                    disabled={saving}
                >
                    {isShoppingMode
                        ? "Sí, añadir"
                        : "Reactivar"}
                </Button>

            </DialogActions>

        </Dialog>

    );

}


export default ProductStatusDialog;