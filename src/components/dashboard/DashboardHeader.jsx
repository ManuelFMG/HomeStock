import Typography from "@mui/material/Typography";

import useAuth from "../../hooks/useAuth";

function DashboardHeader() {

  const { user } = useAuth();

  return (
    <>
      <Typography
        variant="h4"
        fontWeight={700}
      >
        Panel principal
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        Bienvenido de nuevo a HomeStock.
      </Typography>

      {user?.email && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {user.email}
        </Typography>
      )}
    </>
  );
}

export default DashboardHeader;