import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";


function ConfirmDialog({
    open,
    title,
    message,
    onCancel,
    onConfirm,
    confirmText = "Eliminar",
    confirmColor = "error",
    loading = false,
}) {

    return (

        <Dialog
            open={open}
            onClose={
                loading
                    ? undefined
                    : onCancel
            }
            maxWidth="xs"
            fullWidth
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
                    disabled={loading}
                >
                    Cancelar
                </Button>


                <Button
                    color={confirmColor}
                    variant="contained"
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading
                        ? "Procesando..."
                        : confirmText}
                </Button>

            </DialogActions>

        </Dialog>

    );

}


export default ConfirmDialog;