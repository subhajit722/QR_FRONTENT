
import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";

import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";

import api from "../../api/axios";
import "./RestaurantProfile.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(
  /\/api\/?$/,
  ""
);

const initialForm = {
  name: "",
  slug: "",
  phone: "",
  address: "",
  description: "",
  primaryColor: "#35251c",
  secondaryColor: "#c58b45",
  sidebarColor: "#211a17",
  navColor: "#ffffff",
  offerBoxColor: "#fff3e0",
  offerBoxText: "",
};

const imageFields = [
  {
    name: "logo",
    label: "Restaurant Logo",
    description: "Your restaurant's brand logo.",
  },
  {
    name: "bannerImage",
    label: "Menu Banner Image",
    description: "The main image displayed at the top of your menu.",
  },
  {
    name: "offerBoxImage",
    label: "Offer Box Image",
    description: "Image displayed inside your special offer section.",
  },
];

const getImageUrl = (image) => {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_BASE_URL}/uploads/${image.replace(/^\/+/, "")}`;



};




const ColorInput = ({ label, name, value, onChange }) => {
  return (
    <div className="profile-color-field">
      <label htmlFor={`${name}-text`}>{label}</label>

      <div className="profile-color-input">
        {/* Visual color picker */}
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#ffffff"}
          onChange={(e) =>
            onChange({
              target: {
                name,
                value: e.target.value.toUpperCase(),
              },
            })
          }
          aria-label={`${label} color picker`}
        />

        {/* Custom HEX input */}
        <input
          id={`${name}-text`}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder="#FFFFFF"
          maxLength={7}
          className="profile-hex-input"
        />

        {/* Color preview */}
        <span
          className="profile-color-swatch"
          style={{
            backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(value)
              ? value
              : "#ffffff",
          }}
        />
      </div>

      <small>Choose a color or enter your HEX code.</small>
    </div>
  );
};

const RestaurantProfile = () => {
  const [form, setForm] = useState(initialForm);
  const [resetting, setResetting] = useState(false);
  const [images, setImages] = useState({
    logo: "",
    bannerImage: "",
    offerBoxImage: "",
  });

  const [previews, setPreviews] = useState({
    logo: "",
    bannerImage: "",
    offerBoxImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();

    return () => {
      Object.values(previews).forEach((url) => {
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
    // Fetch once when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/profile");
      const restaurant = response.data.restaurant;

      setForm({
        ...initialForm,
        ...restaurant,
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        description: restaurant.description || "",
        offerBoxText: restaurant.offerBoxText || "",
      });

      setImages({
        logo: restaurant.logo || "",
        bannerImage: restaurant.bannerImage || "",
        offerBoxImage: restaurant.offerBoxImage || "",
      });

      setPreviews({
        logo: getImageUrl(restaurant.logo),
        bannerImage: getImageUrl(restaurant.bannerImage),
        offerBoxImage: getImageUrl(restaurant.offerBoxImage),
      });
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load restaurant settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setSuccess("");

    setImages((previous) => ({
      ...previous,
      [field]: file,
    }));

    setPreviews((previous) => {
      if (previous[field]?.startsWith("blob:")) {
        URL.revokeObjectURL(previous[field]);
      }

      return {
        ...previous,
        [field]: URL.createObjectURL(file),
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Restaurant name is required.");
        return;
      }

      const data = new FormData();

      const textFields = [
        "name",
        "phone",
        "address",
        "description",
        "primaryColor",
        "secondaryColor",
        "sidebarColor",
        "navColor",
        "offerBoxColor",
        "offerBoxText",
      ];

      textFields.forEach((field) => {
        data.append(field, form[field] ?? "");
      });

      ["logo", "bannerImage", "offerBoxImage"].forEach((field) => {
        if (images[field] instanceof File) {
          data.append(field, images[field]);
        }
      });

      const response = await api.put("/admin/profile", data);

      const restaurant = response.data.restaurant;

      setForm((previous) => ({
        ...previous,
        ...restaurant,
      }));

      const updatedImages = {
        logo: restaurant.logo || "",
        bannerImage: restaurant.bannerImage || "",
        offerBoxImage: restaurant.offerBoxImage || "",
      };

      setImages(updatedImages);

      setPreviews({
        logo: getImageUrl(restaurant.logo),
        bannerImage: getImageUrl(restaurant.bannerImage),
        offerBoxImage: getImageUrl(restaurant.offerBoxImage),
      });

      setSuccess(
        response.data.message || "Restaurant settings saved successfully."
      );
    } catch (err) {
      console.error("Profile save error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to save restaurant settings."
      );
    } finally {
      setSaving(false);
    }
  };
  
const handleReset = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to reset your restaurant profile?\n\n" +
    "Your restaurant name and menu URL will remain unchanged.\n" +
    "All uploaded profile images will be deleted permanently."
  );

  if (!confirmed) return;

  try {
    setResetting(true);
    setError("");
    setSuccess("");

    const response = await api.post("/admin/profile/reset");

    if (!response.data?.success) {
      throw new Error("Unable to reset restaurant profile.");
    }

    const restaurant = response.data.restaurant;

    // Restore default form values but preserve name and slug.
    setForm({
      ...initialForm,
      name: restaurant.name,
      slug: restaurant.slug,
    });

    // Clear uploaded image references.
    setImages({
      logo: "",
      bannerImage: "",
      offerBoxImage: "",
    });

    // Clear image previews.
    setPreviews({
      logo: "",
      bannerImage: "",
      offerBoxImage: "",
    });

    setSuccess(
      response.data.message ||
      "Restaurant profile reset successfully."
    );

  } catch (err) {
    console.error("Profile reset error:", err);

    setError(
      err.response?.data?.message ||
      err.message ||
      "Unable to reset restaurant profile."
    );
  } finally {
    setResetting(false);
  }
};


  if (loading) {
    return (
      <div className="profile-loading">
        <CircularProgress />
        <p>Loading restaurant settings...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-profile-page">
      <div className="restaurant-profile-header">
        <div>
          <span className="profile-eyebrow">
            RESTAURANT CUSTOMIZATION
          </span>

          <h1>Restaurant Profile</h1>

          <p>
            Manage your restaurant information, menu appearance,
            branding and promotional content.
          </p>
        </div>

        <div className="profile-header-icon">
          <StorefrontRoundedIcon />
        </div>
      </div>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError("")}
        >
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

      <form onSubmit={handleSave}>
        <div className="profile-layout">

          {/* Left settings */}
          <div className="profile-settings">

            {/* Basic information */}
            <section className="profile-card">
              <div className="profile-card-heading">
                <StorefrontRoundedIcon />

                <div>
                  <h2>Restaurant Information</h2>
                  <p>Basic details displayed to your customers.</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <TextField
                  fullWidth
                  label="Restaurant Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <TextField
                  fullWidth
                  label="Restaurant Slug"
                  value={form.slug}
                  disabled
                  helperText="Your public menu URL identifier."
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Main Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Welcome to our restaurant. Enjoy freshly prepared food..."
                  sx={{ gridColumn: "1 / -1" }}
                />
              </div>
            </section>

            {/* Images */}
            <section className="profile-card">
              <div className="profile-card-heading">
                <ImageRoundedIcon />

                <div>
                  <h2>Restaurant Images</h2>
                  <p>Upload your logo, menu banner and offer image.</p>
                </div>
              </div>

              <div className="profile-image-grid">
                {imageFields.map((field) => (
                  <div className="profile-image-field" key={field.name}>
                    <div className="profile-image-heading">
                      <h3>{field.label}</h3>
                      <p>{field.description}</p>
                    </div>

                    <div className={`profile-image-preview ${field.name}`}>
                      {previews[field.name] ? (
                        <img
                          src={previews[field.name]}
                          alt={field.label}
                        />
                      ) : (
                        <ImageRoundedIcon />
                      )}
                    </div>

                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadRoundedIcon />}
                      fullWidth
                    >
                      Upload Image

                      <input
                        hidden
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) =>
                          handleImageChange(e, field.name)
                        }
                      />
                    </Button>

                    <span className="profile-image-hint">
                      JPG, PNG or WEBP · Maximum 5 MB
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Theme colors */}
           
{/* Theme colors */}
<section className="profile-card">
  <div className="profile-card-heading">
    <StorefrontRoundedIcon />

    <div>
      <h2>Menu Theme & Colors</h2>
      <p>
        Choose colors using the picker or enter your own HEX color.
      </p>
    </div>
  </div>

  <div className="profile-color-grid">
    <ColorInput
      label="Primary Theme Color"
      name="primaryColor"
      value={form.primaryColor}
      onChange={handleChange}
    />

    <ColorInput
      label="Secondary Theme Color"
      name="secondaryColor"
      value={form.secondaryColor}
      onChange={handleChange}
    />

    <ColorInput
      label="Sidebar Color"
      name="sidebarColor"
      value={form.sidebarColor}
      onChange={handleChange}
    />

    <ColorInput
      label="Navigation Color"
      name="navColor"
      value={form.navColor}
      onChange={handleChange}
    />

    <ColorInput
      label="Offer Box Background"
      name="offerBoxColor"
      value={form.offerBoxColor}
      onChange={handleChange}
    />
  </div>
</section>


            {/* Offer box */}
            <section className="profile-card">
              <div className="profile-card-heading">
                <ImageRoundedIcon />

                <div>
                  <h2>Special Offer Box</h2>
                  <p>Create a promotional message for your menu.</p>
                </div>
              </div>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Offer Box Text"
                name="offerBoxText"
                value={form.offerBoxText}
                onChange={handleChange}
                placeholder="Special offer! Get amazing discounts on your favourite dishes."
              />

              <div
                className="offer-box-live-preview"
                style={{
                  backgroundColor: form.offerBoxColor,
                  color: form.primaryColor,
                }}
              >
                {previews.offerBoxImage && (
                  <img
                    src={previews.offerBoxImage}
                    alt="Offer"
                  />
                )}

                <div>
                  <span>EXCLUSIVE OFFER</span>

                  <p>
                    {form.offerBoxText ||
                      "Your special promotional message will appear here."}
                  </p>
                </div>
              </div>
            </section>

         
<div className="profile-save-area">

  <Button
    type="button"
    variant="outlined"
    color="error"
    size="large"
    disabled={saving || resetting}
    onClick={handleReset}
  >
    {resetting ? (
      <>
        <CircularProgress size={18} sx={{ mr: 1 }} />
        Resetting...
      </>
    ) : (
      "Reset Profile"
    )}
  </Button>

  <Button
    type="submit"
    variant="contained"
    size="large"
    disabled={saving || resetting}
    startIcon={
      saving ? (
        <CircularProgress size={18} color="inherit" />
      ) : (
        <SaveRoundedIcon />
      )
    }
  >
    {saving ? "Saving Changes..." : "Save Restaurant Settings"}
  </Button>

</div>

          </div>

          {/* Live preview */}
          <aside className="profile-preview-column">
            <div className="profile-preview-sticky">
              <div className="profile-preview-title">
                <h2>Live Preview</h2>
                <span>YOUR MENU BRANDING</span>
              </div>

              <div
                className="restaurant-live-preview"
                style={{
                  "--preview-primary": form.primaryColor,
                  "--preview-secondary": form.secondaryColor,
                  "--preview-sidebar": form.sidebarColor,
                  "--preview-nav": form.navColor,
                }}
              >
                <div className="preview-banner">
                  {previews.bannerImage && (
                    <img
                      src={previews.bannerImage}
                      alt="Menu banner"
                    />
                  )}

                  <div className="preview-banner-content">
                    {previews.logo && (
                      <img
                        className="preview-logo"
                        src={previews.logo}
                        alt="Restaurant logo"
                      />
                    )}

                    <h3>{form.name || "Your Restaurant"}</h3>

                    <p>
                      {form.description ||
                        "Your restaurant description will appear here."}
                    </p>
                  </div>
                </div>

                <div className="preview-navigation">
                  <span>All Items</span>
                  <span>Categories</span>
                  <span>Popular</span>
                </div>

                <div className="preview-content">
                  <h4>Explore Our Menu</h4>

                  <div className="preview-product">
                    <div className="preview-product-image">
                      <ImageRoundedIcon />
                    </div>

                    <div>
                      <strong>Sample Food Item</strong>
                      <p>Delicious freshly prepared food.</p>
                      <span>₹150.00</span>
                    </div>
                  </div>

                  <div
                    className="preview-offer"
                    style={{
                      backgroundColor: form.offerBoxColor,
                      color: form.primaryColor,
                    }}
                  >
                    {previews.offerBoxImage && (
                      <img
                        src={previews.offerBoxImage}
                        alt="Offer preview"
                      />
                    )}

                    <div>
                      <strong>Special Offer</strong>
                      <p>
                        {form.offerBoxText ||
                          "Your promotional message appears here."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="preview-note">
                This is a sample preview. Save your settings to
                apply the branding to your public menu.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
};

export default RestaurantProfile;
