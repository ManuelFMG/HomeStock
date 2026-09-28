import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";


function ShoppingDuplicateDialog({
    open,
    productName,
    existingProductName,
    onClose,
}) {

    return (

        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            disableRestoreFocus
        >

            <DialogTitle>
                Producto ya añadido
            </DialogTitle>


            <DialogContent>

                <DialogContentText>

                    "{productName}" ya está añadido
                    a la Lista de la compra

                    {existingProductName
                        && existingProductName
                        !== productName
                        ? ` como "${existingProductName}".`
                        : "."}

                </DialogContentText>

            </DialogContent>


            <DialogActions>

                <Button
                    variant="contained"
                    onClick={onClose}
                >
                    Cerrar
                </Button>

            </DialogActions>

        </Dialog>

    );

}


export default ShoppingDuplicateDialog;