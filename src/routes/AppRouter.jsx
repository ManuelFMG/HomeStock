import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

const LoginPage = lazy(
  () => import("../pages/LoginPage")
);
const RegisterPage = lazy(
  () => import("../pages/RegisterPage")
);
const DashboardPage = lazy(
  () => import("../pages/DashboardPage")
);
const InventoryPage = lazy(
  () => import("../pages/InventoryPage")
);
const HistoryPage = lazy(
  () => import("../pages/HistoryPage")
);
const ShoppingPage = lazy(
  () => import("../pages/ShoppingPage")
);
const StatisticsPage = lazy(
  () => import("../pages/StatisticsPage")
);
const SettingsPage = lazy(
  () => import("../pages/SettingsPage")
);
const NotFoundPage = lazy(
  () => import("../pages/NotFoundPage")
);

import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import RouteLoadingFallback from "../components/common/RouteLoadingFallback";

function AppRouter() {

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <ShoppingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;