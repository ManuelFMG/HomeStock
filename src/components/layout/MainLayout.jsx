import { Box } from "@mui/material";

import Header from "./Header";
import Footer from "./Footer";

function MainLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <Box
        component="main"
        sx={{
          flex: 1,
        }}
      >
        {children}
      </Box>

      <Footer />
    </Box>
  );
}

export default MainLayout;