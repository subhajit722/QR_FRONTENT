import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { Alert } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CampaignIcon from "@mui/icons-material/Campaign";

import "./Menu.css";
import api from "../../api/axios";

// ----------------------------------
// API BASE URL / HELPERS
// ----------------------------------

const getApiBaseUrl = () => {
  const baseURL =
    api.defaults.baseURL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  return baseURL.replace(/\/+$/, "").replace(/\/api$/i, "");
};

const API_BASE_URL = getApiBaseUrl();

const getImageUrl = (image) => {
  if (!image) return "";

  const imagePath = String(image).trim();
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const cleanPath = imagePath.replace(/^\/+/, "").replace(/^uploads\//i, "");
  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

// First non-empty string wins, so "" from the API still falls back
const pick = (...values) => {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

const toBool = (value) => value === true || Number(value) === 1;

// Picks dark or white text so it stays readable on ANY restaurant colour
const getContrastColor = (hex, fallback = "#ffffff") => {
  if (typeof hex !== "string") return fallback;

  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return fallback;

  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#1f1a17" : "#ffffff";
};

const fadeIn = (e) => e.currentTarget.classList.add("loaded");

// ----------------------------------
// SKELETON LOADER
// ----------------------------------

const MenuSkeleton = () => (
  <div className="customer-menu" aria-busy="true" aria-live="polite">
    <div className="skeleton skeleton-hero" />
    <div className="menu-main">
      <div className="skeleton skeleton-line" style={{ width: "40%", margin: "0 auto 14px" }} />
      <div className="skeleton skeleton-line" style={{ width: "60%", margin: "0 auto 40px" }} />
      <div className="menu-product-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="menu-product-card" key={i}>
            <div className="skeleton skeleton-image" />
            <div className="menu-product-details">
              <div className="skeleton skeleton-line" style={{ width: "70%" }} />
              <div className="skeleton skeleton-line" style={{ width: "100%", marginTop: 12 }} />
              <div className="skeleton skeleton-line" style={{ width: "50%", marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ----------------------------------
// COMPONENT
// ----------------------------------

const Menu = () => {
  const { slug } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showTop, setShowTop] = useState(false);

  const listRef = useRef(null);

  // ----------------------------------
  // FETCH
  // ----------------------------------

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/menu/${encodeURIComponent(slug)}`);

      if (!response.data?.success) {
        throw new Error("Unable to load restaurant menu.");
      }

      setRestaurant(response.data.restaurant || null);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error("Menu loading error:", err);

      setRestaurant(null);
      setCategories([]);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load this restaurant's menu."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      setActiveCategory("all");
      setSearch("");
      fetchMenu();
    }
  }, [slug, fetchMenu]);

  // Page title follows the restaurant
  useEffect(() => {
    if (restaurant?.name) document.title = `${restaurant.name} • Menu`;
  }, [restaurant]);

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ----------------------------------
  // THEME (colours + auto-contrast text colours)
  // ----------------------------------

  const hasBanner = Boolean(restaurant?.bannerImage);

  const theme = useMemo(() => {
    const primary = restaurant?.primaryColor || "#35251c";
    const secondary = restaurant?.secondaryColor || "#c58b45";
    const sidebar = restaurant?.sidebarColor || "#211a17";
    const nav = restaurant?.navColor || "#ffffff";
    const offer = restaurant?.offerBoxColor || "#fff3e0";

    return {
      "--primary-color": primary,
      "--secondary-color": secondary,
      "--sidebar-color": sidebar,
      "--nav-color": nav,
      "--offer-box-color": offer,
      "--on-primary": getContrastColor(primary),
      "--on-secondary": getContrastColor(secondary),
      "--on-sidebar": getContrastColor(sidebar),
      "--on-nav": getContrastColor(nav),
      "--on-offer": getContrastColor(offer),
      "--hero-text": hasBanner ? "#ffffff" : getContrastColor(primary),
    };
  }, [restaurant, hasBanner]);

  // ----------------------------------
  // TEXT CONTENT (all overridable from the backend)
  // ----------------------------------

  const content = useMemo(() => {
    const r = restaurant || {};
    return {
      brandSubtitle: pick(r.brandSubtitle, "RESTAURANT MENU"),
      heroEyebrow: pick(r.heroEyebrow, "WELCOME TO"),
      heroTitle: pick(r.heroTitle, r.name),
      description: pick(
        r.description,
        "Discover delicious food, freshly prepared just for you."
      ),
      exploreButtonText: pick(r.exploreButtonText, "Explore Menu"),
      sectionEyebrow: pick(r.sectionEyebrow, "MADE WITH LOVE"),
      sectionTitle: pick(r.sectionTitle, "Explore Our Menu"),
      sectionSubtitle: pick(
        r.sectionSubtitle,
        "Fresh ingredients. Authentic flavours. Beautiful food."
      ),
      offerBoxEyebrow: pick(r.offerBoxEyebrow, "SPECIAL ANNOUNCEMENT"),
      offerBoxTitle: pick(r.offerBoxTitle, "Special Offers"),
      searchPlaceholder: pick(
        r.searchPlaceholder,
        "Search dishes, e.g. pizza, coffee..."
      ),
      categoryEyebrow: pick(r.categoryEyebrow, "OUR SELECTION"),
      currency: pick(r.currencySymbol, "₹"),
      footerText: pick(
        r.footerText,
        `© ${new Date().getFullYear()} ${r.name || ""}. All Rights Reserved.`
      ),
    };
  }, [restaurant]);

  // ----------------------------------
  // FILTERING
  // ----------------------------------

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

  const totalProducts = useMemo(
    () =>
      categories.reduce(
        (total, category) => total + (category.products?.length || 0),
        0
      ),
    [categories]
  );

  const visibleProducts = useMemo(
    () =>
      filteredCategories.reduce(
        (total, category) => total + category.products.length,
        0
      ),
    [filteredCategories]
  );

  const isFiltering = Boolean(search.trim()) || activeCategory !== "all";

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("all");
  };

  const selectCategory = (id) => {
    setActiveCategory(id);
    // keep the user at the top of the list after switching
    requestAnimationFrame(() =>
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  // ----------------------------------
  // PRODUCT HELPERS
  // ----------------------------------

  const formatPrice = (amount) =>
    `${content.currency}${Number(amount).toFixed(2)}`;

  const getProductPricing = (product) => {
    const originalPrice = Number(product.originalPrice ?? product.price);
    const discountedPrice = Number(product.discountedPrice);

    const hasOffer =
      toBool(product.hasActiveOffer) &&
      Number.isFinite(originalPrice) &&
      Number.isFinite(discountedPrice) &&
      discountedPrice >= 0 &&
      discountedPrice < originalPrice;

    const validOriginal = Number.isFinite(originalPrice) ? originalPrice : 0;

    return {
      originalPrice: validOriginal,
      discountedPrice: hasOffer ? discountedPrice : validOriginal,
      hasOffer,
    };
  };

  const getDiscountLabel = (product) => {
    const offer = product.offer;
    if (!offer) return "SPECIAL OFFER";

    if (offer.discountType === "percentage") {
      return `${Number(offer.discountValue)}% OFF`;
    }
    return `${content.currency}${Number(offer.discountValue)} OFF`;
  };

  // ----------------------------------
  // LOADING / ERROR
  // ----------------------------------

  if (loading) return <MenuSkeleton />;

  if (error) {
    return (
      <div className="menu-full-error">
        <Alert severity="error">{error}</Alert>
        <button onClick={fetchMenu}>Try Again</button>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="menu-full-error">
        <RestaurantMenuIcon style={{ fontSize: 56, opacity: 0.4 }} />
        <h2>Restaurant not found</h2>
        <p>This restaurant menu is currently unavailable.</p>
      </div>
    );
  }

  // ----------------------------------
  // DERIVED VALUES
  // ----------------------------------

  const logoUrl = getImageUrl(restaurant.logo);
  const bannerUrl = getImageUrl(restaurant.bannerImage);
  const offerImageUrl = getImageUrl(restaurant.offerBoxImage);

  const offerText = restaurant.offerBoxText?.trim();
  const hasOfferBox = Boolean(offerText || offerImageUrl);
  const hasFooterContact = Boolean(restaurant.address || restaurant.phone);

  // ----------------------------------
  // RENDER
  // ----------------------------------

  return (
    <div className="customer-menu" style={theme}>
      {/* HERO */}
      <header className={`menu-hero ${bannerUrl ? "has-banner" : ""}`}>
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="menu-hero-banner"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        <div className="menu-hero-overlay">
          <div className="menu-top-brand">
            <div className="menu-brand-icon">
              {logoUrl ? (
                <img src={logoUrl} alt={`${restaurant.name} logo`} />
              ) : (
                <RestaurantMenuIcon />
              )}
            </div>

            <div className="menu-brand-name">
              <h2>{restaurant.name}</h2>
              <span>{content.brandSubtitle}</span>
            </div>
          </div>

          <div className="menu-hero-content">
            <span className="menu-eyebrow">{content.heroEyebrow}</span>

            <h1>{content.heroTitle}</h1>

            <p className="menu-hero-description">{content.description}</p>

            <div className="menu-hero-actions">
              <a href="#explore-menu" className="menu-explore-button">
                {content.exploreButtonText}
              </a>

              <div className="menu-hero-info">
                <span>
                  <RestaurantMenuIcon />
                  {categories.length}{" "}
                  {categories.length === 1 ? "Category" : "Categories"}
                </span>
                <span>
                  {totalProducts} {totalProducts === 1 ? "Dish" : "Dishes"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* STICKY TOOLBAR: search + categories */}
      <div className="menu-toolbar" id="explore-menu">
        <div className="menu-toolbar-inner">
          <div className="menu-search" role="search">
            <SearchIcon aria-hidden="true" />

            <input
              type="search"
              placeholder={content.searchPlaceholder}
              aria-label="Search the menu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                className="menu-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <nav className="menu-category-navigation" aria-label="Menu categories">
            <button
              className={activeCategory === "all" ? "active" : ""}
              aria-pressed={activeCategory === "all"}
              onClick={() => selectCategory("all")}
            >
              All Items
            </button>

            {categories.map((category) => {
              const active = String(activeCategory) === String(category.id);
              return (
                <button
                  key={category.id}
                  className={active ? "active" : ""}
                  aria-pressed={active}
                  onClick={() => selectCategory(category.id)}
                >
                  {category.name}
                  <small>{category.products?.length || 0}</small>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* MAIN */}
      <main className="menu-main">
        <section className="menu-section-heading">
          <span className="menu-eyebrow">{content.sectionEyebrow}</span>
          <h2>{content.sectionTitle}</h2>
          <p>{content.sectionSubtitle}</p>
        </section>

        {/* OFFER BOX */}
        {hasOfferBox && (
          <section className="restaurant-offer-box">
            <div className="restaurant-offer-content">
              <span className="menu-eyebrow offer-eyebrow">
                <CampaignIcon />
                {content.offerBoxEyebrow}
              </span>
              <h2>{content.offerBoxTitle}</h2>
              {offerText && <p>{offerText}</p>}
            </div>

            {offerImageUrl && (
              <div className="restaurant-offer-image">
                <img
                  src={offerImageUrl}
                  alt="Restaurant special offer"
                  onLoad={fadeIn}
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = "none";
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* RESULT SUMMARY */}
        {isFiltering && (
          <div className="menu-results-bar" aria-live="polite">
            <span>
              Showing <strong>{visibleProducts}</strong>{" "}
              {visibleProducts === 1 ? "dish" : "dishes"}
              {search.trim() && (
                <>
                  {" "}
                  for “<strong>{search.trim()}</strong>”
                </>
              )}
            </span>
            <button onClick={resetFilters}>Clear filters</button>
          </div>
        )}

        {/* PRODUCTS */}
        <div ref={listRef} className="menu-list-anchor">
          {filteredCategories.length === 0 ? (
            <div className="menu-empty">
              <RestaurantMenuIcon />
              <h3>No dishes found</h3>
              <p>Try another search or pick a different category.</p>
              {isFiltering && (
                <button className="menu-empty-button" onClick={resetFilters}>
                  Show full menu
                </button>
              )}
            </div>
          ) : (
            <div className="menu-category-list">
              {filteredCategories.map((category) => (
                <section className="menu-category-section" key={category.id}>
                  <div className="menu-category-title">
                    <div>
                      <span className="menu-eyebrow">
                        {content.categoryEyebrow}
                      </span>

                      <h3>{category.name}</h3>

                      {category.description && <p>{category.description}</p>}
                    </div>

                    <span className="menu-item-count">
                      {category.products.length}{" "}
                      {category.products.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>

                  <div className="menu-product-grid">
                    {category.products.map((product) => {
                      const pricing = getProductPricing(product);
                      const available = toBool(product.isAvailable);
                      const productImage = getImageUrl(product.image);

                      return (
                        <article
                          className={`menu-product-card ${
                            !available ? "sold-out" : ""
                          }`}
                          key={product.id}
                        >
                          <div className="menu-product-image">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                loading="lazy"
                                onLoad={fadeIn}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="menu-image-placeholder">
                                <RestaurantMenuIcon />
                              </div>
                            )}

                            {pricing.hasOffer && available && (
                              <span className="product-offer-badge">
                                <LocalOfferIcon />
                                {getDiscountLabel(product)}
                              </span>
                            )}

                            {!available && (
                              <span className="sold-out-label">SOLD OUT</span>
                            )}
                          </div>

                          <div className="menu-product-details">
                            <div className="menu-product-name-row">
                              <h4>{product.name}</h4>

                              <div className="menu-product-price-wrapper">
                                {pricing.hasOffer && (
                                  <span className="menu-original-price">
                                    {formatPrice(pricing.originalPrice)}
                                  </span>
                                )}

                                <span
                                  className={`menu-product-price ${
                                    pricing.hasOffer ? "offer-price" : ""
                                  }`}
                                >
                                  {formatPrice(pricing.discountedPrice)}
                                </span>
                              </div>
                            </div>

                            {product.description && (
                              <p className="menu-product-description">
                                {product.description}
                              </p>
                            )}

                            <div className="menu-product-footer">
                              <span
                                className={
                                  available
                                    ? "availability available"
                                    : "availability unavailable"
                                }
                              >
                                {available ? "Available" : "Currently unavailable"}
                              </span>

                              {pricing.hasOffer && available && (
                                <span className="offer-available-text">
                                  You save{" "}
                                  {formatPrice(
                                    pricing.originalPrice -
                                      pricing.discountedPrice
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="menu-footer">
        <div className="menu-footer-brand">
          {logoUrl && <img src={logoUrl} alt={`${restaurant.name} logo`} />}
          <h3>{restaurant.name}</h3>
        </div>

        {restaurant.description?.trim() && (
          <p className="menu-footer-description">{restaurant.description}</p>
        )}

        {hasFooterContact && (
          <div className="menu-footer-contact">
            {restaurant.address && (
              <span>
                <LocationOnIcon />
                {restaurant.address}
              </span>
            )}

            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`}>
                <PhoneIcon />
                {restaurant.phone}
              </a>
            )}
          </div>
        )}

        <div className="menu-footer-bottom">{content.footerText}</div>
      </footer>

      {/* BACK TO TOP */}
      <button
        className={`menu-back-to-top ${showTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <KeyboardArrowUpIcon />
      </button>
    </div>
  );
};

export default Menu;
