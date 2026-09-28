import Typography from "@mui/material/Typography";

function PageTitle({ children }) {
  return (
    <Typography
      variant="h3"
      component="h1"
      sx={{
        mb: 3,
        fontWeight: "bold",
      }}
    >
      {children}
    </Typography>
  );
}

export default PageTitle;