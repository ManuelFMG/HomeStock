import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme/theme";

import { AuthProvider } from "./context/AuthContext";

import { HomeProvider } from "./context/HomeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <HomeProvider>
          <App />
        </HomeProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);