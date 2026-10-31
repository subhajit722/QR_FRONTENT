import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  CircularProgress,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import "./Menu.css";
import api from "../../api/axios";

const IMAGE_BASE_URL = "http://localhost:5000";

const getImageUrl = (image) => {
  if (!image) return null;

  if (image.startsWith("http")) return image;

  return `${IMAGE_BASE_URL}/uploads/${image}`;
};

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/menu");

      setCategories(
        response.data.categories ||
        response.data.data ||
        []
      );
    } catch (err) {
      console.error("Menu loading error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load the menu. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories
      .filter(
        (category) =>
          activeCategory === "all" ||
          String(category.id) === String(activeCategory)
      )
      .map((category) => ({
        ...category,
        products: (category.products || []).filter((product) => {
          if (!keyword) return true;

          return (
            product.name?.toLowerCase().includes(keyword) ||
            product.description?.toLowerCase().includes(keyword)
          );
        }),
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, search, activeCategory]);

  const totalProducts = categories.reduce(
    (total, category) => total + (category.products?.length || 0),
    0
  );

  return (
    <div className="customer-menu">
      {/* Hero section */}
      <header className="menu-hero">
        <div className="menu-hero-overlay">
          <div className="menu-brand-icon">
            <RestaurantMenuIcon />
          </div>

          <p className="menu-eyebrow">WELCOME TO OUR RESTAURANT</p>

          <h1>Good Food, Great Moments.</h1>

          <p className="menu-hero-description">
            Explore our freshly prepared dishes and discover
            your next favourite meal.
          </p>

          <div className="menu-hero-info">
            <span>
              <RestaurantMenuIcon fontSize="small" />
              {categories.length} Categories
            </span>

            <span>
              {totalProducts} Menu Items
            </span>
          </div>
        </div>
      </header>

      <main className="menu-main">
        {/* Section heading */}
        <div className="menu-section-heading">
          <p className="menu-eyebrow">MADE WITH LOVE</p>
          <h2>Explore Our Menu</h2>
          <p>Fresh ingredients. Authentic flavours. Beautiful food.</p>
        </div>

        {/* Search */}
        <div className="menu-search">
          <SearchIcon />

          <input
            type="text"
            placeholder="Search your favourite food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              Clear
            </button>
          )}
        </div>

        {/* Category navigation */}
        {!loading && !error && (
          <div className="menu-category-navigation">
            <button
              className={
                activeCategory === "all" ? "active" : ""
              }
              onClick={() => setActiveCategory("all")}
            >
              All Items
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                className={
                  String(activeCategory) === String(category.id)
                    ? "active"
                    : ""
                }
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="menu-loading">
            <CircularProgress />
            <p>Preparing your menu...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="menu-message">
            <Alert severity="error">{error}</Alert>
            <button onClick={fetchMenu}>Try Again</button>
          </div>
        )}

        {/* Menu products */}
        {!loading && !error && (
          <>
            {filteredCategories.length === 0 ? (
              <div className="menu-empty">
                <RestaurantMenuIcon />
                <h3>No dishes found</h3>
                <p>Try another search or category.</p>
              </div>
            ) : (
              <div className="menu-category-list">
                {filteredCategories.map((category) => (
                  <section
                    className="menu-category-section"
                    key={category.id}
                  >
                    <div className="menu-category-title">
                      <div>
                        <span className="menu-eyebrow">
                          OUR SELECTION
                        </span>

                        <h3>{category.name}</h3>

                        {category.description && (
                          <p>{category.description}</p>
                        )}
                      </div>

                      <span className="menu-item-count">
                        {category.products.length} Items
                      </span>
                    </div>

                    <div className="menu-product-grid">
                      {category.products.map((product) => (
                        <article
                          className={`menu-product-card ${
                            !product.isAvailable ? "sold-out" : ""
                          }`}
                          key={product.id}
                        >
                          <div className="menu-product-image">
                            {product.image ? (
                              <img
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="menu-image-placeholder">
                                <RestaurantMenuIcon />
                              </div>
                            )}

                            {!product.isAvailable && (
                              <span className="sold-out-label">
                                SOLD OUT
                              </span>
                            )}
                          </div>

                          <div className="menu-product-details">
                            <div className="menu-product-name-row">
                              <h4>{product.name}</h4>

                              <span className="menu-product-price">
                                ₹{Number(product.price).toFixed(2)}
                              </span>
                            </div>

                            {product.description && (
                              <p className="menu-product-description">
                                {product.description}
                              </p>
                            )}

                            <div className="menu-product-footer">
                              <span
                                className={
                                  product.isAvailable
                                    ? "availability available"
                                    : "availability unavailable"
                                }
                              >
                                {product.isAvailable
                                  ? "Available"
                                  : "Currently unavailable"}
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="menu-footer">
        <div className="menu-footer-icon">
          <RestaurantMenuIcon />
        </div>

        <h3>Thank You for Visiting</h3>

        <p>We hope you enjoy every bite.</p>

        <span>© {new Date().getFullYear()} All Rights Reserved</span>
      </footer>
    </div>
  );
};

export default Menu;