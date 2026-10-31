

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
  LocalOfferRounded,
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

// Remove /api to get the backend origin for image URLs.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(
  /\/api\/?$/,
  ""
);

// Generate image URL.
const getImageUrl = (image) => {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_BASE_URL}/uploads/${image.replace(/^\/+/, "")}`;
};

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
  const [offers, setOffers] = useState([]);

const [offerModalOpen, setOfferModalOpen] = useState(false);
const [editingOfferId, setEditingOfferId] = useState(null);
const [selectedProduct, setSelectedProduct] = useState(null);
const [offerSaving, setOfferSaving] = useState(false);

const initialOfferForm = {
  discountType: "percentage",
  discountValue: "",
  startAt: "",
  endAt: "",
  status: "active",
};

const [offerForm, setOfferForm] = useState(initialOfferForm);
const [offerErrors, setOfferErrors] = useState({});

  const [deleteId, setDeleteId] = useState(null);

  // Extract array from API response.
  const extractArray = (response, key) => {
    const data = response.data;

    if (Array.isArray(data)) return data;

    if (Array.isArray(data[key])) return data[key];

    if (Array.isArray(data.data)) return data.data;

    return [];
  };
// Convert API date to datetime-local input format
const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
};

// Find offer for a product
const getProductOffer = (productId) => {
  return offers.find(
    (offer) => Number(offer.productId) === Number(productId)
  );
};

// Open offer modal
const handleOpenOffer = (product) => {
  const existingOffer = getProductOffer(product.id);

  setSelectedProduct(product);
  setOfferErrors({});

  if (existingOffer) {
    setEditingOfferId(existingOffer.id);

    setOfferForm({
      discountType: existingOffer.discountType,
      discountValue: existingOffer.discountValue,
      startAt: toDateTimeLocal(existingOffer.startAt),
      endAt: toDateTimeLocal(existingOffer.endAt),
      status: existingOffer.status,
    });
  } else {
    setEditingOfferId(null);
    setOfferForm(initialOfferForm);
  }

  setOfferModalOpen(true);
};

// Handle offer form inputs
const handleOfferChange = (event) => {
  const { name, value } = event.target;

  setOfferForm((previous) => ({
    ...previous,
    [name]: value,
  }));

  setOfferErrors((previous) => ({
    ...previous,
    [name]: "",
  }));
};

// Validate offer
const validateOfferForm = () => {
  const errors = {};

  const value = Number(offerForm.discountValue);
  const price = Number(selectedProduct?.price);

  if (
    !offerForm.discountValue ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    errors.discountValue = "Enter a valid discount.";
  } else if (
    offerForm.discountType === "percentage" &&
    value > 100
  ) {
    errors.discountValue = "Discount cannot exceed 100%.";
  } else if (
    offerForm.discountType === "fixed" &&
    value >= price
  ) {
    errors.discountValue =
      "Fixed discount must be less than product price.";
  }

  if (!offerForm.startAt) {
    errors.startAt = "Start date is required.";
  }

  if (!offerForm.endAt) {
    errors.endAt = "End date is required.";
  }

  if (
    offerForm.startAt &&
    offerForm.endAt &&
    new Date(offerForm.startAt) >= new Date(offerForm.endAt)
  ) {
    errors.endAt = "End date must be after start date.";
  }

  setOfferErrors(errors);

  return Object.keys(errors).length === 0;
};

// Save offer
const handleOfferSubmit = async (event) => {
  event.preventDefault();

  if (!validateOfferForm()) return;

  try {
    setOfferSaving(true);

    const payload = {
      discountType: offerForm.discountType,
      discountValue: Number(offerForm.discountValue),
      startAt: new Date(offerForm.startAt).toISOString(),
      endAt: new Date(offerForm.endAt).toISOString(),
      status: offerForm.status,
    };

    if (editingOfferId) {
      await api.put(
        `/offers/${editingOfferId}`,
        payload
      );
    } else {
      await api.post("/offers", {
        ...payload,
        productId: selectedProduct.id,
      });
    }

    setAlert({
      type: "success",
      message: editingOfferId
        ? "Offer updated successfully."
        : "Offer created successfully.",
    });

    setOfferModalOpen(false);
    setOfferForm(initialOfferForm);
    setSelectedProduct(null);
    setEditingOfferId(null);

    await fetchPageData();

  } catch (error) {
    console.error("Save offer error:", error);

    setAlert({
      type: "error",
      message:
        error.response?.data?.message ||
        "Unable to save offer.",
    });

  } finally {
    setOfferSaving(false);
  }
};

// Delete offer
const handleDeleteOffer = async () => {
  if (!editingOfferId) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this offer?"
  );

  if (!confirmed) return;

  try {
    setOfferSaving(true);

    await api.delete(`/offers/${editingOfferId}`);

    setAlert({
      type: "success",
      message: "Offer deleted successfully.",
    });

    setOfferModalOpen(false);
    setEditingOfferId(null);
    setSelectedProduct(null);

    await fetchPageData();

  } catch (error) {
    console.error("Delete offer error:", error);

    setAlert({
      type: "error",
      message:
        error.response?.data?.message ||
        "Unable to delete offer.",
    });

  } finally {
    setOfferSaving(false);
  }
};
  // Fetch products and categories.
const fetchPageData = async () => {
  try {
    setLoading(true);
    setAlert({ type: "", message: "" });

    const [
      productResponse,
      categoryResponse,
      offerResponse,
    ] = await Promise.all([
      api.get("/products"),
      api.get("/categories"),
      api.get("/offers"),
    ]);

    setProducts(extractArray(productResponse, "products"));
    setCategories(extractArray(categoryResponse, "categories"));
    setOffers(extractArray(offerResponse, "offers"));

  } catch (error) {
    console.error("Products fetch error:", error);

    setAlert({
      type: "error",
      message:
        error.response?.data?.message ||
        "Unable to load products, categories or offers.",
    });

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPageData();
  }, []);

  // Handle form inputs.
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

  // Handle image selection.
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

  // Revoke temporary image preview URLs.
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Validate product form.
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

    if (
      formData.price === "" ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) <= 0 ||
      Number(formData.price) > 99999999.99
    ) {
      errors.price = "Enter a valid price greater than zero.";
    }

    if (!formData.categoryId) {
      errors.categoryId = "Please select a category.";
    }

    if (!editingId && !selectedImage) {
      errors.image = "Please upload a product image.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Open create product modal.
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

  // Open edit product modal.
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

    // Use Render backend image URL instead of localhost.
    const currentImageUrl = getImageUrl(product.image);

    setExistingImageUrl(currentImageUrl);
    setImagePreview(currentImageUrl);

    setFormErrors({});

    setOpenModal(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save product.
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
      setExistingImageUrl("");

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

  // Delete product.
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
      console.error("Delete product error:", error);

      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete product.",
      });

      setDeleteId(null);
    }
  };

  // Update product availability.
  const handleAvailability = async (product) => {
    try {
      const payload = new FormData();

      payload.append("name", product.name);

      payload.append(
        "description",
        product.description || ""
      );

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
            ? {
                ...item,
                isAvailable: !product.isAvailable,
              }
            : item
        )
      );

    } catch (error) {
      console.error("Availability update error:", error);

      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to update product availability.",
      });
    }
  };

  // Search and category filtering.
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      String(product.categoryId || product.category?.id) ===
        String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Cancel image change.
  const handleCancelImageChange = () => {
    setSelectedImage(null);
    setImagePreview(existingImageUrl);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="products-page">

      {/* Header */}
      <header className="products-header">

        <div>
          <p className="products-eyebrow">
            MENU CONFIGURATION
          </p>

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
            "&:hover": {
              background: "#684932",
            },
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
          <h2>
            {products.filter((item) => item.isAvailable).length}
          </h2>
        </div>

        <div>
          <p>Unavailable</p>
          <h2>
            {products.filter((item) => !item.isAvailable).length}
          </h2>
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
              <Button
                onClick={handleAdd}
                sx={{ color: "#805a3d" }}
              >
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
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            <ImageOutlined />
                          </div>
                        )}

                        <div>
                          <strong>{product.name}</strong>
                          
                          {/* <small>#{product.id}</small> */}
                          {getProductOffer(product.id) && (
  <small style={{
    color: "#228b5a",
    fontWeight: 600,
    display: "block",
  }}>
    <LocalOfferRounded
      sx={{
        fontSize: 13,
        verticalAlign: "middle",
        mr: 0.5,
      }}
    />

    {getProductOffer(product.id).status === "active"
      ? "Offer configured"
      : "Offer inactive"}
  </small>
)}
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
                          {product.isAvailable
                            ? "Available"
                            : "Unavailable"}
                        </span>

                      </div>
                    </td>

                    <td>
                    <div className="product-actions">

  <IconButton
    size="small"
    onClick={() => handleOpenOffer(product)}
    title={
      getProductOffer(product.id)
        ? "Edit offer"
        : "Add offer"
    }
    sx={{
      color: getProductOffer(product.id)
        ? "#228b5a"
        : "#806044",
    }}
  >
    <LocalOfferRounded />
  </IconButton>

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
            <h2>
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

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
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />

                ) : (

                  <>
                    <CloudUploadOutlined />

                    <strong>Click to upload image</strong>

                    <span>
                      JPG, PNG or WEBP · Maximum 5 MB
                    </span>
                  </>

                )}

              </div>

              {selectedImage && (
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={handleCancelImageChange}
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

                <p>
                  Show this product as available on your menu.
                </p>
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
                  "&:hover": {
                    background: "#684932",
                  },
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

      {/* Add/Edit Offer Modal */}
<Dialog
  open={offerModalOpen}
  onClose={() => !offerSaving && setOfferModalOpen(false)}
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
      <h2>
        {editingOfferId ? "Manage Offer" : "Create Product Offer"}
      </h2>

      <p>
        {selectedProduct?.name}
      </p>
    </div>

    <IconButton
      onClick={() => setOfferModalOpen(false)}
      disabled={offerSaving}
    >
      <CloseRounded />
    </IconButton>

  </DialogTitle>

  <DialogContent>

    <form
      className="product-form"
      onSubmit={handleOfferSubmit}
      noValidate
    >

      {/* Original price */}
      <Alert severity="info">
        Original price: ₹
        {Number(selectedProduct?.price || 0).toFixed(2)}
      </Alert>

      {/* Discount type */}
      <div className="product-form-field">

        <label>Discount Type *</label>

        <TextField
          select
          fullWidth
          size="small"
          name="discountType"
          value={offerForm.discountType}
          onChange={handleOfferChange}
        >
          <MenuItem value="percentage">
            Percentage Discount (%)
          </MenuItem>

          <MenuItem value="fixed">
            Fixed Discount (₹)
          </MenuItem>
        </TextField>

      </div>

      {/* Discount value */}
      <div className="product-form-field">

        <label>
          Discount Value *
        </label>

        <TextField
          fullWidth
          size="small"
          type="number"
          name="discountValue"
          placeholder={
            offerForm.discountType === "percentage"
              ? "Example: 20"
              : "Example: 50"
          }
          value={offerForm.discountValue}
          onChange={handleOfferChange}
          error={Boolean(offerErrors.discountValue)}
          helperText={offerErrors.discountValue}
          inputProps={{
            min: 0.01,
            step: "0.01",
          }}
        />

      </div>

      {/* Discount preview */}
      <div className="product-form-field">

        <label>Discounted Price Preview</label>

        <h2 style={{ color: "#228b5a", margin: 0 }}>

          ₹
          {(() => {
            const price = Number(selectedProduct?.price || 0);
            const discount = Number(offerForm.discountValue || 0);

            const finalPrice =
              offerForm.discountType === "percentage"
                ? price - (price * discount) / 100
                : price - discount;

            return Math.max(0, finalPrice).toFixed(2);
          })()}

        </h2>

      </div>

      {/* Start date */}
      <div className="product-form-field">

        <label>Offer Start Date *</label>

        <TextField
          fullWidth
          size="small"
          type="datetime-local"
          name="startAt"
          value={offerForm.startAt}
          onChange={handleOfferChange}
          error={Boolean(offerErrors.startAt)}
          helperText={offerErrors.startAt}
          InputLabelProps={{ shrink: true }}
        />

      </div>

      {/* End date */}
      <div className="product-form-field">

        <label>Offer End Date *</label>

        <TextField
          fullWidth
          size="small"
          type="datetime-local"
          name="endAt"
          value={offerForm.endAt}
          onChange={handleOfferChange}
          error={Boolean(offerErrors.endAt)}
          helperText={offerErrors.endAt}
          InputLabelProps={{ shrink: true }}
        />

      </div>

      {/* Status */}
      <div className="product-form-field">

        <label>Offer Status</label>

        <TextField
          select
          fullWidth
          size="small"
          name="status"
          value={offerForm.status}
          onChange={handleOfferChange}
        >
          <MenuItem value="active">
            Active
          </MenuItem>

          <MenuItem value="inactive">
            Inactive
          </MenuItem>
        </TextField>

      </div>

      {/* Actions */}
      <div className="product-form-actions">

        {editingOfferId && (
          <Button
            color="error"
            variant="outlined"
            onClick={handleDeleteOffer}
            disabled={offerSaving}
          >
            Delete Offer
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={() => setOfferModalOpen(false)}
          disabled={offerSaving}
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
          disabled={offerSaving}
          sx={{
            background: "#493326",
            textTransform: "none",
            "&:hover": {
              background: "#684932",
            },
          }}
        >
          {offerSaving ? (
            <CircularProgress size={21} color="inherit" />
          ) : editingOfferId ? (
            "Update Offer"
          ) : (
            "Create Offer"
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

        <DialogTitle>
          Delete Product?
        </DialogTitle>

        <DialogContent>

          <p className="product-delete-text">
            Are you sure you want to permanently delete this food item?
            This action cannot be undone.
          </p>

          <div className="product-form-actions">

            <Button
              onClick={() => setDeleteId(null)}
              sx={{
                color: "#65564b",
                textTransform: "none",
              }}
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
