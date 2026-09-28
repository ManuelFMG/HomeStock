import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";


function OpeningStatusDialog({
    open,
    productName,
    saving,
    onCancel,
    onConfirm,
}) {

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
                Deshacer apertura
            </DialogTitle>


            <DialogContent>

                <DialogContentText>
                    ¿Deseas eliminar la fecha de apertura de
                    {" "}
                    "{productName}"?
                </DialogContentText>

            </DialogContent>


            <DialogActions>

                <Button
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancelar
                </Button>


                <Button
                    color="success"
                    variant="contained"
                    onClick={onConfirm}
                    disabled={saving}
                >
                    {saving
                        ? "Deshaciendo..."
                        : "Deshacer apertura"}
                </Button>

            </DialogActions>

        </Dialog>

    );

}


export default OpeningStatusDialog;