
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const isSuperAdminRequest = config.url?.startsWith("/super-admin");

    const token = isSuperAdminRequest
      ? localStorage.getItem("superAdminToken")
      : localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Do not manually set Content-Type.
    // Axios handles JSON and FormData automatically.

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
