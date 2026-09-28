import { AppBar, Toolbar, Typography } from "@mui/material";

import useAuth from "../../hooks/useAuth";

import Button from "@mui/material/Button";

import { logout } from "../../services/authService";

function Header() {

  const { user } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>

        <Typography
          variant="h6"
          component="h1"
        >
          🏠 HomeStock
        </Typography>

        {user && (
          <>
            <Typography
              variant="body2"
              sx={{ ml: "auto" }}
            >
              {user.email}
            </Typography>

            <Button
              color="inherit"
              onClick={logout}
              sx={{ ml: 2 }}
            >
              Salir
            </Button>
          </>
        )}

      </Toolbar>
    </AppBar>
  );
}

export default Header;