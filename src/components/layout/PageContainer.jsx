import { Container } from "@mui/material";

function PageContainer({ children }) {
  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
      }}
    >
      {children}
    </Container>
  );
}

export default PageContainer;