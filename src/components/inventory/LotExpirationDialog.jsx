import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function LotExpirationDialog({
  open,
  lotLabel,
  initialExpirationDate,
  saving,
  onCancel,
  onConfirm,
}) {
  const [expirationDate, setExpirationDate] = useState("");

  useEffect(() => {
    if (open) {
      setExpirationDate(initialExpirationDate || "");
    }
  }, [open, initialExpirationDate]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
    >
      <DialogTitle>Editar caducidad del lote</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="normal"
          type="date"
          label={`Caducidad de ${lotLabel}`}
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
          onClick={() => onConfirm(expirationDate)}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LotExpirationDialog;
