
import { useEffect, useState } from "react";
import {
  CategoryRounded,
  RestaurantMenuRounded,
  Inventory2Outlined,
  ArrowForwardRounded,
  AddRounded,
} from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryResponse, productResponse] = await Promise.all([
        api.get("/categories"),
        api.get("/products"),
      ]);

      setCategories(
        categoryResponse.data.categories || categoryResponse.data.data || []
      );

      setProducts(
        productResponse.data.products || productResponse.data.data || []
      );
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load dashboard data. Check your API routes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Categories",
      value: categories.length,
      icon: <CategoryRounded />,
      color: "brown",
      description: "Menu categories",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: <RestaurantMenuRounded />,
      color: "gold",
      description: "Food menu items",
    },
    {
      title: "Available Items",
      value: products.filter((item) => item.isAvailable).length,
      icon: <Inventory2Outlined />,
      color: "green",
      description: "Currently available",
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <CircularProgress sx={{ color: "#806044" }} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">RESTAURANT MANAGEMENT</p>
          <h1>Dashboard Overview</h1>
          <p className="dashboard-subtitle">
            Here's what's happening with your restaurant menu.
          </p>
        </div>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => navigate("/admin/products")}
          sx={{
            background: "#493326",
            borderRadius: "8px",
            padding: "11px 18px",
            textTransform: "none",
            "&:hover": { background: "#684932" },
          }}
        >
          Add Product
        </Button>
      </header>

      {error && (
        <div className="dashboard-error">
          {error}
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      )}

      <section className="dashboard-stats">
        {stats.map((item) => (
          <div className="stat-card" key={item.title}>
            <div className={`stat-icon ${item.color}`}>
              {item.icon}
            </div>

            <div className="stat-content">
              <p>{item.title}</p>
              <h2>{item.value}</h2>
              <span>{item.description}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="dashboard-content">
        <div className="dashboard-section-header">
          <div>
            <h2>Recent Menu Items</h2>
            <p>Your latest food products</p>
          </div>

          <button
            className="view-all-button"
            onClick={() => navigate("/admin/products")}
          >
            View All <ArrowForwardRounded />
          </button>
        </div>

        <div className="dashboard-table-wrapper">
          {products.length === 0 ? (
            <div className="dashboard-empty">
              <RestaurantMenuRounded />
              <h3>No products yet</h3>
              <p>Add your first food item to get started.</p>
              <Button
                onClick={() => navigate("/admin/products")}
                sx={{ color: "#805a3d", mt: 1 }}
              >
                Add your first product
              </Button>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-table-name">
                        {product.image ? (
                          <img
                            src={`http://localhost:5000/uploads/${product.image}`}
                            alt={product.name}
                          />
                        ) : (
                          <div className="product-placeholder">
                            <RestaurantMenuRounded />
                          </div>
                        )}

                        <span>{product.name}</span>
                      </div>
                    </td>

                    <td>
                      {product.category?.name || "-"}
                    </td>

                    <td>
                      ₹{Number(product.price).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={
                          product.isAvailable
                            ? "product-status available"
                            : "product-status unavailable"
                        }
                      >
                        {product.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
