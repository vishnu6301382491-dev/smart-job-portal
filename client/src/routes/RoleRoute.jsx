import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/ui/Loader";

export const RoleRoute = ({ allowedRoles = [] }) => {
  const { authReady, isAuthenticated, user } = useAuth();

  if (!authReady) {
    return (
      <div className="page-shell py-12">
        <Loader label="Loading access rules" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

