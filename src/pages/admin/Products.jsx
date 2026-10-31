
import { useEffect, useRef, useState } from "react";

import {
  AddRounded,
  SearchRounded,
  EditOutlined,
  DeleteOutlineRounded,
  RestaurantMenuRounded,
  CloseRounded,
  CloudUploadOutlined,
  ImageOutlined,
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
  MenuItem,
} from "@mui/material";

import api from "../../api/axios";
import "./Products.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  isAvailable: true,
};

const Products = () => {
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });

  const [deleteId, setDeleteId] = useState(null);

  // API response helper
  const extractArray = (response, key) => {
    const data = response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data[key])) return data[key];
    if (Array.isArray(data.data)) return data.data;

    return [];
  };

  // Fetch products and categories
  const fetchPageData = async () => {
    try {
      setLoading(true);
      setAlert({ type: "", message: "" });

      const [productResponse, categoryResponse] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);

      setProducts(extractArray(productResponse, "products"));
      setCategories(extractArray(categoryResponse, "categories"));
    } catch (error) {
      console.error("Products fetch error:", error);

      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load products. Please check your API.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  // Form input handler
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

  // Image selection
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormErrors((previous) => ({
        ...previous,
        image: "Only JPG, PNG and WEBP images are allowed.",
      }));

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((previous) => ({
        ...previous,
        image: "Image size must be less than 5 MB.",
      }));

      event.target.value = "";
      return;
    }

    setFormErrors((previous) => ({
      ...previous,
      image: "",
    }));

    setSelectedImage(file);

    setImagePreview(URL.createObjectURL(file));
  };

  // Clear image preview URL when replaced or component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Product name is required.";
    } else if (formData.name.trim().length > 200) {
      errors.name = "Product name cannot exceed 200 characters.";
    }

    if (formData.description.length > 2000) {
      errors.description = "Description cannot exceed 2000 characters.";
    }

    if (formData.price === "" || Number(formData.price) <= 0) {
      errors.price = "Enter a valid price greater than zero.";
    } else if (
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) > 99999999.99
    ) {
      errors.price = "Enter a valid price.";
    }

    if (!formData.categoryId) {
      errors.categoryId = "Please select a category.";
    }

    if (
      !editingId &&
      !selectedImage
    ) {
      errors.image = "Please upload a product image.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Open create modal
  const handleAdd = () => {
    setExistingImageUrl("");
    setEditingId(null);
    setFormData(initialForm);
    setSelectedImage(null);
    setImagePreview("");
    setFormErrors({});
    setOpenModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Open edit modal
  const handleEdit = (product) => {
    setEditingId(product.id);

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      categoryId: product.categoryId || product.category?.id || "",
      isAvailable: Boolean(product.isAvailable),
    });

    setSelectedImage(null);

  const currentImageUrl = product.image
  ? `http://localhost:5000/uploads/${product.image}`
  : "";

setExistingImageUrl(currentImageUrl);
setImagePreview(currentImageUrl);

    setFormErrors({});
    setOpenModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save product
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = new FormData();

      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("price", formData.price);
      payload.append("categoryId", formData.categoryId);
      payload.append("isAvailable", String(formData.isAvailable));

      if (selectedImage) {
        payload.append("image", selectedImage);
      }

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setAlert({
        type: "success",
        message: editingId
          ? "Product updated successfully."
          : "Product created successfully.",
      });

      setOpenModal(false);
      setFormData(initialForm);
      setSelectedImage(null);
      setImagePreview("");

      await fetchPageData();
    } catch (error) {
      console.error("Save product error:", error);

      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save product. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);

      setAlert({
        type: "success",
        message: "Product deleted successfully.",
      });

      setDeleteId(null);

      await fetchPageData();
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete product.",
      });

      setDeleteId(null);
    }
  };

  // Availability toggle
  const handleAvailability = async (product) => {
    try {
      const payload = new FormData();

      payload.append("name", product.name);
      payload.append("description", product.description || "");
      payload.append("price", product.price);
      payload.append(
        "categoryId",
        product.categoryId || product.category?.id
      );
      payload.append(
        "isAvailable",
        String(!product.isAvailable)
      );

      await api.put(`/products/${product.id}`, payload);

      setProducts((previous) =>
        previous.map((item) =>
          item.id === product.id
            ? { ...item, isAvailable: !product.isAvailable }
            : item
        )
      );
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to update product availability.",
      });
    }
  };

  // Search and category filtering
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      String(product.categoryId || product.category?.id) ===
        String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http")) return image;

    return `http://localhost:5000/uploads/${image}`;
  };

  return (
    <div className="products-page">

      {/* Header */}
      <header className="products-header">
        <div>
          <p className="products-eyebrow">MENU CONFIGURATION</p>
          <h1>Food Products</h1>
          <p className="products-subtitle">
            Manage food items, prices, images and availability.
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
          Add Product
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

      {/* Summary */}
      <section className="products-summary">
        <div>
          <p>Total Products</p>
          <h2>{products.length}</h2>
        </div>

        <div>
          <p>Available</p>
          <h2>{products.filter((item) => item.isAvailable).length}</h2>
        </div>

        <div>
          <p>Unavailable</p>
          <h2>{products.filter((item) => !item.isAvailable).length}</h2>
        </div>

        <div>
          <p>Total Categories</p>
          <h2>{categories.length}</h2>
        </div>
      </section>

      {/* Search and filter */}
      <section className="products-toolbar">
        <div className="product-search">
          <SearchRounded />

          <input
            type="text"
            placeholder="Search food products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          <option value="all">All Categories</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </section>

      {/* Product table */}
      <section className="products-table-container">
        {loading ? (
          <div className="products-loading">
            <CircularProgress sx={{ color: "#806044" }} />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="products-empty">
            <RestaurantMenuRounded />

            <h3>
              {search || selectedCategory !== "all"
                ? "No matching products"
                : "No food products yet"}
            </h3>

            <p>
              Add your first food product to start building your menu.
            </p>

            {!search && selectedCategory === "all" && (
              <Button onClick={handleAdd} sx={{ color: "#805a3d" }}>
                Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="products-table-scroll">
            <table className="products-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>AVAILABILITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name-cell">
                        {product.image ? (
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            <ImageOutlined />
                          </div>
                        )}

                        <div>
                          <strong>{product.name}</strong>
                          <small>#{product.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {product.category?.name ||
                        categories.find(
                          (cat) =>
                            Number(cat.id) === Number(product.categoryId)
                        )?.name ||
                        "-"}
                    </td>

                    <td>
                      ₹{Number(product.price).toFixed(2)}
                    </td>

                    <td>
                      <div className="product-availability">
                        <Switch
                          size="small"
                          checked={Boolean(product.isAvailable)}
                          onChange={() => handleAvailability(product)}
                          color="success"
                        />

                        <span>
                          {product.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="product-actions">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(product)}
                          title="Edit product"
                        >
                          <EditOutlined />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => setDeleteId(product.id)}
                          title="Delete product"
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
      </section>

      {/* Add/Edit Modal */}
      <Dialog
        open={openModal}
        onClose={() => !saving && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle className="product-dialog-title">
          <div>
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <p>
              {editingId
                ? "Update food product information."
                : "Add a new food item to your menu."}
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
            className="product-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Image upload */}
            <div className="product-form-field">
              <label>Product Image *</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleImageChange}
              />

              <div
                className="product-image-upload"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="product-image-preview"
                  />
                ) : (
                  <>
                    <CloudUploadOutlined />

                    <strong>Click to upload image</strong>

                    <span>JPG, PNG or WEBP · Maximum 5 MB</span>
                  </>
                )}
              </div>

          {selectedImage && (
  <button
    type="button"
    className="remove-image-button"
    onClick={() => {
      setSelectedImage(null);
      setImagePreview(existingImageUrl);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }}
  >
    Cancel image change
  </button>
)}

              {formErrors.image && (
                <span className="product-field-error">
                  {formErrors.image}
                </span>
              )}
            </div>

            {/* Name */}
            <div className="product-form-field">
              <label>Product Name *</label>

              <TextField
                fullWidth
                size="small"
                name="name"
                placeholder="e.g. Chicken Biryani"
                value={formData.name}
                onChange={handleChange}
                error={Boolean(formErrors.name)}
                helperText={formErrors.name}
                inputProps={{ maxLength: 200 }}
              />
            </div>

            {/* Description */}
            <div className="product-form-field">
              <label>Description</label>

              <TextField
                fullWidth
                multiline
                rows={3}
                name="description"
                placeholder="Describe your food item..."
                value={formData.description}
                onChange={handleChange}
                error={Boolean(formErrors.description)}
                helperText={formErrors.description}
              />
            </div>

            {/* Price */}
            <div className="product-form-field">
              <label>Price (₹) *</label>

              <TextField
                fullWidth
                size="small"
                type="number"
                name="price"
                placeholder="Enter price"
                value={formData.price}
                onChange={handleChange}
                error={Boolean(formErrors.price)}
                helperText={formErrors.price}
                inputProps={{
                  min: 0.01,
                  max: 99999999.99,
                  step: "0.01",
                }}
              />
            </div>

            {/* Category */}
            <div className="product-form-field">
              <label>Category *</label>

              <TextField
                select
                fullWidth
                size="small"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                error={Boolean(formErrors.categoryId)}
                helperText={formErrors.categoryId}
                SelectProps={{
                  displayEmpty: true,
                }}
              >
                <MenuItem value="" disabled>
                  Select category
                </MenuItem>

                {categories
                  .filter((category) => category.status)
                  .map((category) => (
                    <MenuItem
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
              </TextField>
            </div>

            {/* Availability */}
            <div className="product-form-status">
              <div>
                <strong>Product Availability</strong>
                <p>Show this product as available on your menu.</p>
              </div>

              <Switch
                checked={formData.isAvailable}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    isAvailable: event.target.checked,
                  }))
                }
                color="success"
              />
            </div>

            {/* Actions */}
            <div className="product-form-actions">
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
                  "Update Product"
                ) : (
                  "Create Product"
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
        <DialogTitle>Delete Product?</DialogTitle>

        <DialogContent>
          <p className="product-delete-text">
            Are you sure you want to permanently delete this food item?
            This action cannot be undone.
          </p>

          <div className="product-form-actions">
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

export default Products;
