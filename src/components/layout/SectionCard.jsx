import Paper from "@mui/material/Paper";

function SectionCard({ children }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        mb: 3,
      }}
    >
      {children}
    </Paper>
  );
}

export default SectionCard;