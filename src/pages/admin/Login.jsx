
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurant } from "../../context/RestaurantContext";
import {
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";

import {
  RestaurantMenuRounded,
  Visibility,
  VisibilityOff,
  LockOutlined,
  ArrowForwardRounded,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
 // Log the API URL for debugging
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loadRestaurant } = useRestaurant();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.username.trim() || !formData.password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

   const response =   await login(formData.username.trim(), formData.password);

      await loadRestaurant();

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left branding section */}
        <section className="login-brand">
          <div className="brand-content">
            <div className="brand-logo">
              <RestaurantMenuRounded />
            </div>

            <p className="brand-overline">RESTAURANT MANAGEMENT</p>

            <h1>
              Manage your
              <br />
              restaurant with
              <br />
              <span>elegance.</span>
            </h1>

            <p className="brand-description">
              A simple and beautiful space to manage your food menu,
              categories and restaurant details.
            </p>

            <div className="brand-bottom">
              <span className="brand-line"></span>
              <p>YOUR MENU. YOUR EXPERIENCE.</p>
            </div>
          </div>
        </section>

        {/* Right login section */}
        <section className="login-form-section">
          <div className="login-form-wrapper">

            <div className="mobile-logo">
              <RestaurantMenuRounded />
              <span>MENU ADMIN</span>
            </div>

            <div className="login-heading">
              <div className="login-icon">
                <LockOutlined />
              </div>

              <p className="login-eyebrow">WELCOME BACK</p>

              <h2>Admin Login</h2>

              <p className="login-subtitle">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            {error && (
              <Alert
                severity="error"
                className="login-alert"
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="login-form">

              <div className="form-field">
                <label htmlFor="username">Username</label>

                <TextField
                  id="username"
                  name="username"
                  fullWidth
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={loading}
                  size="medium"
                />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>

                <TextField
                  id="password"
                  name="password"
                  fullWidth
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  size="medium"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                          edge="end"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowForwardRounded />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <span className="footer-dot"></span>
              Secure administrator access
            </div>

          </div>
        </section>
      </div>

      <p className="page-copyright">
        © {new Date().getFullYear()} Restaurant Menu Management
      </p>
    </div>
  );
};

export default Login;
