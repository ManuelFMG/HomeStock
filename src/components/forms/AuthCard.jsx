import {
  Card,
  CardContent,
} from "@mui/material";

function AuthCard({ children }) {
  return (
    <Card
      elevation={4}
      sx={{
        maxWidth: 450,
        mx: "auto",
        mt: 8,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {children}
      </CardContent>
    </Card>
  );
}

export default AuthCard;