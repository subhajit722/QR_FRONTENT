import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";

import {
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
  LockOutlined,
} from "@mui/icons-material";

import api from "../../api/axios";
import "./SuperAdmin.css";

const SuperAdminLogin = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/super-admin/login", {
        username: form.username.trim(),
        password: form.password,
      });

      const token = response.data.token;

      if (!token) {
        throw new Error("Login response did not contain an authentication token.");
      }

      localStorage.setItem("superAdminToken", token);

      navigate("/super-admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="super-login-wrapper">
      <Container maxWidth="sm">
        <Paper elevation={0} className="super-login-card">
          <Box className="super-login-icon">
            <AdminPanelSettings />
          </Box>

          <Typography variant="h4" fontWeight={800} textAlign="center">
            Super Admin
          </Typography>

          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 1, mb: 4 }}
          >
            Sign in to manage your restaurant clients
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              margin="normal"
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              margin="normal"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mt: 4 }}
          >
            QR Menu Management System
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default SuperAdminLogin;