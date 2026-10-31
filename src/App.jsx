
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminProtectedRoute from "./routes/SuperAdminProtectedRoute";

import AdminLayout from "./pages/admin/AdminLayout";
import Categories from "./pages/admin/Categories";
import Products from "./pages/admin/Products";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import QRCodePage from "./pages/admin/QRCode";
import RestaurantProfile from "./pages/admin/RestaurantProfile";
import Menu from "./pages/public/Menu";

import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import { RestaurantProvider } from "./context/RestaurantContext";

function App() {
  return (
    <AuthProvider>
        <RestaurantProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Pages */}
          <Route
            path="/"
            element={
              <div style={{ padding: "30px" }}>
                Customer menu coming soon.
              </div>
            }
          />

          <Route path="/menu/:slug" element={<Menu />} />

          {/* Super Admin */}
          <Route
            path="/super-admin/login"
            element={<SuperAdminLogin />}
          />

          <Route element={<SuperAdminProtectedRoute />}>
            <Route
              path="/super-admin/dashboard"
              element={<SuperAdminDashboard />}
            />
          </Route>

          {/* Restaurant Admin Login */}
          <Route
            path="/admin/login"
            element={<Login />}
          />

          {/* Protected Restaurant Admin Pages */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>

              <Route
                path="/admin/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/admin/categories"
                element={<Categories />}
              />

              <Route
                path="/admin/products"
                element={<Products />}
              />

              <Route
                path="/admin/qr-code"
                element={<QRCodePage />}
              />

          <Route
  path="/admin/profile"
  element={
   
      <RestaurantProfile />
   
  }
/>

            </Route>
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default App;
