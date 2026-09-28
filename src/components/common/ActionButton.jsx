import Button from "@mui/material/Button";

function ActionButton({
  children,
  ...props
}) {
  return (
    <Button
      variant="contained"
      {...props}
    >
      {children}
    </Button>
  );
}

export default ActionButton;