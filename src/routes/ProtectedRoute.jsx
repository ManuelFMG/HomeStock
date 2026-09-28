import {
  Navigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";
import RouteLoadingFallback from "../components/common/RouteLoadingFallback";

import {
  NotificationsProvider,
} from "../context/NotificationsContext";

function ProtectedRoute({
  children,
}) {

  const { user, loading } =
    useAuth();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <NotificationsProvider>
      {children}
    </NotificationsProvider>
  );
}

export default ProtectedRoute;