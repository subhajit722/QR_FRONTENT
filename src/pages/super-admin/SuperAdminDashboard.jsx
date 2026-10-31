import { useEffect, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  Add,
  Logout,
  Restaurant,
  People,
  Refresh,
  Close,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import api from "../../api/supeapi";
import "./SuperAdmin.css";

const initialForm = {
  restaurantName: "",
  username: "",
  password: "",
  phone: "",
  address: "",
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/super-admin/clients");

      setClients(response.data.clients || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load restaurant clients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.restaurantName.trim() ||
      !form.username.trim() ||
      !form.password
    ) {
      setError("Restaurant name, username and password are required.");
      return;
    }

    if (form.password.length < 12) {
      setError("Admin password must contain at least 12 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/super-admin/clients", {
        restaurantName: form.restaurantName.trim(),
        username: form.username.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      setSuccess(
        response.data.message || "Restaurant client created successfully."
      );

      setForm(initialForm);
      setOpen(false);

      await fetchClients();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create restaurant client."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    navigate("/super-admin/login", { replace: true });
  };

  return (
    <Box className="super-dashboard">
      <AppBar position="static" className="super-appbar" elevation={0}>
        <Toolbar>
          <Restaurant sx={{ mr: 1.5 }} />

          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
            QR Menu Admin
          </Typography>

          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Dashboard
            </Typography>

            <Typography color="text.secondary">
              Manage your restaurant clients and accounts.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchClients}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setError("");
                setOpen(true);
              }}
            >
              Add Restaurant
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card className="super-stat-card">
              <CardContent>
                <Restaurant color="primary" fontSize="large" />

                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Total Restaurants
                </Typography>

                <Typography variant="h3" fontWeight={800}>
                  {clients.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card className="super-stat-card">
              <CardContent>
                <People color="success" fontSize="large" />

                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Total Admin Accounts
                </Typography>

                <Typography variant="h3" fontWeight={800}>
                  {clients.reduce(
                    (total, client) =>
                      total + (client.admin?.length || 0),
                    0
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card className="super-table-card">
          <CardContent>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Restaurant Clients
            </Typography>

            {loading ? (
              <Box className="super-loading">
                <CircularProgress />
              </Box>
            ) : clients.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={5}>
                No restaurant clients found. Create your first client.
              </Typography>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <table className="super-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Restaurant</th>
                      <th>Slug</th>
                      <th>Admin Username</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td>#{client.id}</td>

                        <td>
                          <strong>{client.name}</strong>
                          <small>{client.phone || "No phone number"}</small>
                        </td>

                        <td>{client.slug}</td>

                        <td>
                          {client.admin?.length
                            ? client.admin
                                .map((admin) => admin.username)
                                .join(", ")
                            : "No admin"}
                        </td>

                        <td>
                          <span
                            className={`super-status ${
                              client.status === "active"
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>

                        <td>
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      <Dialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle fontWeight={800}>
          Create Restaurant Client

          <IconButton
            onClick={() => setOpen(false)}
            disabled={saving}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <Box component="form" onSubmit={handleCreateClient}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField
                label="Restaurant Name"
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Admin Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Admin Password (minimum 12 characters)"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Restaurant Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                multiline
                rows={2}
                fullWidth
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setOpen(false)}
              disabled={saving}
              color="inherit"
            >
              Cancel
            </Button>

            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Creating..." : "Create Client"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SuperAdminDashboard;