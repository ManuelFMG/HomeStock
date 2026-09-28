import Button from "@mui/material/Button";

function PrimaryButton({
  children,
  ...props
}) {
  return (
    <Button
      fullWidth
      size="large"
      variant="contained"
      sx={{
        mt: 2,
        py: 1.5,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export default PrimaryButton;