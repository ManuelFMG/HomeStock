import Typography from "@mui/material/Typography";

function AuthTitle({ children }) {
  return (
    <Typography
      variant="h4"
      component="h2"
      align="center"
      gutterBottom
      sx={{
        fontWeight: 700,
        mb: 3,
      }}
    >
      {children}
    </Typography>
  );
}

export default AuthTitle;