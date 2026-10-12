import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

function ShoppingInventoryWarningDialog({
  open,
  productName,
  matches,
  saving,
  onCancel,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
    >
      <DialogTitle>Producto disponible en Inventario</DialogTitle>

      <DialogContent>
        <DialogContentText>
          Ya tienes existencias de "{productName}". ¿Deseas añadirlo de todas formas a la Lista de la compra?
        </DialogContentText>

        <List dense disablePadding sx={{ mt: 1 }}>
          {matches.map((product) => {
            const quantity = Number(product.quantity) || 0;
            return (
              <ListItem key={product.id} disableGutters>
                <ListItemText
                  primary={product.name}
                  secondary={`${quantity} ${quantity === 1 ? "unidad disponible" : "unidades disponibles"} · ${product.storage || "Sin ubicación"}`}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={saving}>
          {saving ? "Añadiendo..." : "Añadir de todas formas"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShoppingInventoryWarningDialog;