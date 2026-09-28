import MainLayout from "../components/layout/MainLayout";
import PageContainer from "../components/layout/PageContainer";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardInventorySummary from "../components/dashboard/DashboardInventorySummary";
import DashboardMenu from "../components/dashboard/DashboardMenu";

import DashboardExpirationAlerts from "../components/notifications/DashboardExpirationAlerts";


function DashboardPage() {

  return (

    <MainLayout>

      <PageContainer>

        <DashboardHeader />

        <DashboardInventorySummary />

        <DashboardExpirationAlerts />

        <DashboardMenu />

      </PageContainer>

    </MainLayout>

  );

}


export default DashboardPage;