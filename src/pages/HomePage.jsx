import Typography from "@mui/material/Typography";

import MainLayout from "../components/layout/MainLayout";
import PageContainer from "../components/layout/PageContainer";
import PageTitle from "../components/layout/PageTitle";
import SectionCard from "../components/layout/SectionCard";

function HomePage() {
  return (
    <MainLayout>
      <PageContainer>
        <PageTitle>🏠 HomeStock</PageTitle>

        <SectionCard>
          <Typography variant="body1">
            Bienvenido a HomeStock.
          </Typography>

          <Typography variant="body1" sx={{ mt: 2 }}>
            Muy pronto podrás gestionar:
          </Typography>

          <Typography component="ul" sx={{ mt: 2 }}>
            <li>🥬 Frigorífico</li>
            <li>❄️ Congelador</li>
            <li>🥫 Despensa de alimentación</li>
            <li>🧴 Despensa de limpieza</li>
          </Typography>
        </SectionCard>
      </PageContainer>
    </MainLayout>
  );
}

export default HomePage;