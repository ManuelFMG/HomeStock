import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
    },
    secondary: {
      main: "#66BB6A",
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
    error: {
      main: "#D32F2F",
    },
    warning: {
      main: "#F57C00",
    },
    success: {
      main: "#388E3C",
    },
    text: {
      primary: "#212121",
      secondary: "#757575",
    },
  },

  typography: {
    fontFamily: "Roboto, Arial, sans-serif",

    h1: {
      fontSize: "2rem",
      fontWeight: 700,
    },

    h2: {
      fontSize: "1.6rem",
      fontWeight: 700,
    },

    body1: {
      fontSize: "1rem",
    },
  },

  shape: {
    borderRadius: 12,
  },
});

export default theme;