import Typography from "@mui/material/Typography";

function AuthSubtitle({ children }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      sx={{
        mb: 3,
      }}
    >
      {children}
    </Typography>
  );
}

export default AuthSubtitle;