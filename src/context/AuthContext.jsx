
import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("adminData")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("adminToken") || null
  );

  // RESTAURANT ADMIN LOGIN
  const login = async (username, password) => {
    const response = await api.post("/admin/login", {
      username,
      password,
    });

    const data = response.data;

    if (!data.success || !data.token) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("adminToken", data.token);
    localStorage.setItem(
      "adminData",
      JSON.stringify(data.admin)
    );

    setToken(data.token);
    setAdmin(data.admin);

    return data;
  };

  // RESTAURANT ADMIN LOGOUT
  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");

    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: Boolean(token && admin),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
