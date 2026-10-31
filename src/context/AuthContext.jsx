
import { createContext, useContext, useState } from "react";
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

  const login = async (username, password) => {
    const response = await api.post("/admin/login", {
      username,
      password,
    });
    console.log("Login Response:", response); // Debugging line

    const data = response.data;

    if (!data.success || !data.token) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminData", JSON.stringify(data.admin));

    setToken(data.token);
    setAdmin(data.admin);

    return data;
  };

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
        isAuthenticated: Boolean(token),
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
