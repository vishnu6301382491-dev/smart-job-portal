import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/ui/Loader";

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="page-shell py-12">
        <Loader label="Checking session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

