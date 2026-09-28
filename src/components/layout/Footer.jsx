import { Box, Typography } from "@mui/material";

function Footer() {
  return (
    <Box
      sx={{
        py: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="body2">
        HomeStock Versión 0.1.0 © 2026
      </Typography>
    </Box>
  );
}

export default Footer;