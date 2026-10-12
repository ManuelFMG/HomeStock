import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function AddLotDialog({
  open,
  saving,
  onCancel,
  onConfirm,
}) {
  const [quantity, setQuantity] = useState("1");
  const [expirationDate, setExpirationDate] = useState("");

  useEffect(() => {
    if (open) {
      setQuantity("1");
      setExpirationDate("");
    }
  }, [open]);

  const numericQuantity = Number(quantity);
  const quantityIsValid = Number.isInteger(numericQuantity) && numericQuantity >= 1;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
    >
      <DialogTitle>Añadir lote</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          required
          margin="normal"
          type="number"
          label="Cantidad"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={saving}
          error={!quantityIsValid}
          helperText={quantityIsValid ? "" : "Introduce un número entero mayor o igual que 1."}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />

        <TextField
          fullWidth
          margin="normal"
          type="date"
          label="Fecha de caducidad"
          value={expirationDate}
          onChange={(event) => setExpirationDate(event.target.value)}
          disabled={saving}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(numericQuantity, expirationDate)}
          disabled={saving || !quantityIsValid}
        >
          {saving ? "Añadiendo..." : "Añadir lote"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddLotDialog;