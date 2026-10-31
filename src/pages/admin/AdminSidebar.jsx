
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRestaurant } from "../../context/RestaurantContext";
import {
  DashboardRounded,
  RestaurantMenuRounded,
  CategoryRounded,
  PersonOutlineRounded,
  LogoutRounded,
  QrCode2Rounded,

} from "@mui/icons-material";

import "./AdminSidebar.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  
  const menuItems = [
    {
      title: "Overview",
      path: "/admin/dashboard",
      icon: <DashboardRounded />,
    },
    {
      title: "Categories",
      path: "/admin/categories",
      icon: <CategoryRounded />,
    },
    {
      title: "Products",
      path: "/admin/products",
      icon: <RestaurantMenuRounded />,
    },
    {
      title: "Profile",
      path: "/admin/profile",
      icon: <PersonOutlineRounded />,
    },
      {
      title: "QR Code",
      path: "/admin/qr-code",
      icon: <QrCode2Rounded />,
    },
 
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };
    const { restaurant, loadingRestaurant } = useRestaurant();
console.log("Restaurant data in AdminSidebar:", restaurant);
  if (loadingRestaurant) {
    return <div>Loading restaurant...</div>;
  }

  return (
    <aside className="admin-sidebar" >
      <div className="sidebar-brand">
        <div className="sidebar-logo">
        {restaurant?.logo ? (
  <img
    src={`${import.meta.env.VITE_IMG_URL}/${restaurant.logo}`}
    alt="Restaurant Logo"
  />
) : (
  <RestaurantMenuRounded />
)}
        </div>

        <div>
          <h2>MENU<span>.</span></h2>
          <p>RESTAURANT ADMIN</p>
        </div>
      </div>

      <div className="sidebar-section-label">
        MAIN MENU
      </div>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin/dashboard"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {admin?.username?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className="user-info">
            <h4>{admin?.username || "Admin"}</h4>
            <p>Administrator</p>
          </div>
        </div>

        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogoutRounded />
          <span>Logout</span>
        </button>

        <div className="sidebar-version">
          <QrCode2Rounded />
          <span>QR Menu System · v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
