import { Navigate, Outlet } from "react-router-dom";

const SuperAdminProtectedRoute = () => {
  const token = localStorage.getItem("superAdminToken");

  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/super-admin/login" replace />
  );
};

export default SuperAdminProtectedRoute;