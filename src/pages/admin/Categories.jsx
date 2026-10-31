
import { useEffect, useState } from "react";

import {
  AddRounded,
  SearchRounded,
  EditOutlined,
  DeleteOutlineRounded,
  CategoryRounded,
  CloseRounded,
} from "@mui/icons-material";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  TextField,
} from "@mui/material";

import api from "../../api/axios";
import "./Categories.css";

const initialForm = {
  name: "",
  description: "",
  status: true,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });

  const [deleteId, setDeleteId] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await api.get("/categories");

      const data =
        response.data.categories ||
        response.data.data ||
        [];

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch categories error:", error);

      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Category name is required.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Category name must have at least 2 characters.";
    } else if (formData.name.trim().length > 150) {
      errors.name = "Category name cannot exceed 150 characters.";
    }

    if (formData.description.length > 1000) {
      errors.description = "Description cannot exceed 1000 characters.";
    }

    const duplicate = categories.find(
      (category) =>
        category.name?.trim().toLowerCase() ===
          formData.name.trim().toLowerCase() &&
        Number(category.id) !== Number(editingId)
    );

    if (duplicate) {
      errors.name = "This category already exists.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Input handler
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // Open add modal
  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFormErrors({});
    setOpenModal(true);
    setAlert({ type: "", message: "" });
  };

  // Open edit modal
  const handleEdit = (category) => {
    setEditingId(category.id);

    setFormData({
      name: category.name || "",
      description: category.description || "",
      status: Boolean(category.status),
    });

    setFormErrors({});
    setOpenModal(true);
    setAlert({ type: "", message: "" });
  };

  // Save category
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);

        setAlert({
          type: "success",
          message: "Category updated successfully.",
        });
      } else {
        await api.post("/categories", payload);

        setAlert({
          type: "success",
          message: "Category created successfully.",
        });
      }

      setOpenModal(false);
      setFormData(initialForm);

      await fetchCategories();
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Something went wrong while saving category.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteId}`);

      setAlert({
        type: "success",
        message: "Category deleted successfully.",
      });

      setDeleteId(null);

      await fetchCategories();
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete category. It may contain products.",
      });

      setDeleteId(null);
    }
  };

  // Change category status
  const handleStatusChange = async (category) => {
    try {
      await api.put(`/categories/${category.id}`, {
        name: category.name,
        description: category.description || "",
        status: !category.status,
      });

      setAlert({
        type: "success",
        message: "Category status updated.",
      });

      await fetchCategories();
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to update category status.",
      });
    }
  };

  // Search filter
  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="categories-page">

      {/* Header */}
      <header className="categories-header">
        <div>
          <p className="categories-eyebrow">
            MENU CONFIGURATION
          </p>

          <h1>Categories</h1>

          <p className="categories-subtitle">
            Organize your restaurant menu into categories.
          </p>
        </div>

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={handleAdd}
          sx={{
            background: "#493326",
            borderRadius: "8px",
            padding: "11px 18px",
            textTransform: "none",
            "&:hover": { background: "#684932" },
          }}
        >
          Add Category
        </Button>
      </header>

      {/* Alerts */}
      {alert.message && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert({ type: "", message: "" })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Stats */}
      <div className="category-summary">
        <div className="category-summary-icon">
          <CategoryRounded />
        </div>

        <div>
          <p>Total Categories</p>
          <h2>{categories.length}</h2>
        </div>

        <div className="category-summary-divider" />

        <div>
          <p>Active Categories</p>
          <h2>
            {categories.filter((item) => item.status).length}
          </h2>
        </div>

        <div className="category-summary-divider" />

        <div>
          <p>Inactive Categories</p>
          <h2>
            {categories.filter((item) => !item.status).length}
          </h2>
        </div>
      </div>

      {/* Search */}
      <div className="category-toolbar">
        <div className="category-search">
          <SearchRounded />

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <p>
          Showing <strong>{filteredCategories.length}</strong> categories
        </p>
      </div>

      {/* Category list */}
      <div className="category-table-container">
        {loading ? (
          <div className="category-loading">
            <CircularProgress sx={{ color: "#806044" }} />
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="category-empty">
            <CategoryRounded />

            <h3>
              {search ? "No matching categories" : "No categories yet"}
            </h3>

            <p>
              {search
                ? "Try searching with another category name."
                : "Create your first category to organize your food menu."}
            </p>

            {!search && (
              <Button
                onClick={handleAdd}
                sx={{ color: "#805a3d", mt: 1 }}
              >
                Add Your First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="category-table-scroll">
            <table className="category-table">
              <thead>
                <tr>
                  <th>CATEGORY</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="category-name-cell">
                        <div className="category-row-icon">
                          <CategoryRounded />
                        </div>

                        <div>
                          <strong>{category.name}</strong>
                          <small>ID: #{category.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="category-description">
                        {category.description || "No description"}
                      </span>
                    </td>

                    <td>
                      <div className="category-status-cell">
                        <span
                          className={
                            category.status
                              ? "category-status active"
                              : "category-status inactive"
                          }
                        >
                          {category.status ? "Active" : "Inactive"}
                        </span>

                        <Switch
                          size="small"
                          checked={Boolean(category.status)}
                          onChange={() => handleStatusChange(category)}
                          color="success"
                        />
                      </div>
                    </td>

                    <td>
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <div className="category-actions">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(category)}
                          title="Edit category"
                        >
                          <EditOutlined />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => setDeleteId(category.id)}
                          title="Delete category"
                          sx={{ color: "#bd655a" }}
                        >
                          <DeleteOutlineRounded />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog
        open={openModal}
        onClose={() => !saving && setOpenModal(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "14px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle className="category-dialog-title">
          <div>
            <h2>{editingId ? "Edit Category" : "Add New Category"}</h2>
            <p>
              {editingId
                ? "Update your category information."
                : "Create a new category for your restaurant menu."}
            </p>
          </div>

          <IconButton
            onClick={() => setOpenModal(false)}
            disabled={saving}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <form
            className="category-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="category-form-field">
              <label>Category Name *</label>

              <TextField
                name="name"
                fullWidth
                placeholder="e.g. Main Course"
                value={formData.name}
                onChange={handleChange}
                error={Boolean(formErrors.name)}
                helperText={formErrors.name}
                inputProps={{ maxLength: 150 }}
                size="small"
              />
            </div>

            <div className="category-form-field">
              <label>Description</label>

              <TextField
                name="description"
                fullWidth
                multiline
                rows={4}
                placeholder="Write a short description..."
                value={formData.description}
                onChange={handleChange}
                error={Boolean(formErrors.description)}
                helperText={
                  formErrors.description ||
                  `${formData.description.length}/1000 characters`
                }
              />
            </div>

            <div className="category-form-status">
              <div>
                <strong>Category Status</strong>
                <p>Make this category visible in your menu.</p>
              </div>

              <Switch
                checked={formData.status}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    status: event.target.checked,
                  }))
                }
                color="success"
              />
            </div>

            <div className="category-form-actions">
              <Button
                variant="outlined"
                onClick={() => setOpenModal(false)}
                disabled={saving}
                sx={{
                  color: "#65564b",
                  borderColor: "#ded5ca",
                  textTransform: "none",
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  background: "#493326",
                  textTransform: "none",
                  "&:hover": { background: "#684932" },
                }}
              >
                {saving ? (
                  <CircularProgress size={21} color="inherit" />
                ) : editingId ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Category?</DialogTitle>

        <DialogContent>
          <p className="delete-dialog-text">
            Are you sure you want to delete this category? This action
            cannot be undone. Categories containing products may not
            be deletable.
          </p>

          <div className="category-form-actions">
            <Button
              onClick={() => setDeleteId(null)}
              sx={{ color: "#65564b", textTransform: "none" }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Categories;
