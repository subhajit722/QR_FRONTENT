
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import Categories from "./pages/admin/Categories";
import Products from "./pages/admin/Products";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import QRCodePage from "./pages/admin/QRCode";
import Menu from "./pages/public/Menu";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<div style={{ padding: "30px" }}>Customer menu coming soon.</div>}
          />

          <Route path="/admin/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
<Route path="/admin/qr-code" element={<QRCodePage />} />
              {/* We'll create these pages next */}
          <Route path="/admin/categories" element={<Categories />} />

           <Route
  path="/admin/products"
  element={<Products />}
/>

              <Route
                path="/admin/profile"
                element={<div>Admin profile coming soon.</div>}
              />
            </Route>
          </Route>
          <Route path="/menu" element={<Menu />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
