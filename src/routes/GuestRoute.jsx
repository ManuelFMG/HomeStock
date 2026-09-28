import { Navigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import RouteLoadingFallback from "../components/common/RouteLoadingFallback";

function GuestRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default GuestRoute;