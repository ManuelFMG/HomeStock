import Alert from "@mui/material/Alert";

function MessageAlert({
  severity = "error",
  children,
}) {
  return (
    <Alert
      severity={severity}
      sx={{ mt: 2 }}
    >
      {children}
    </Alert>
  );
}

export default MessageAlert;