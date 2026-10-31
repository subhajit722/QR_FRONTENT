import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const RestaurantContext = createContext(null);

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  // Fetch complete restaurant profile
  const loadRestaurant = useCallback(async () => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      setRestaurant(null);
      return;
    }

    try {
      setLoadingRestaurant(true);

      const response = await api.get("/admin/profile");

      if (response.data.success && response.data.restaurant) {
        // Store ALL restaurant fields
        setRestaurant(response.data.restaurant);

        console.log(
          "Complete restaurant data loaded:",
          response.data.restaurant
        );
      }
    } catch (error) {
      console.error(
        "Failed to load restaurant:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingRestaurant(false);
    }
  }, []);

  // Update restaurant globally after profile save
  const updateRestaurant = (updatedRestaurant) => {
    setRestaurant((previous) => ({
      ...previous,
      ...updatedRestaurant,
    }));
  };

  // Clear restaurant data on logout
  const clearRestaurant = () => {
    setRestaurant(null);
  };

  useEffect(() => {
    if (localStorage.getItem("adminToken")) {
      loadRestaurant();
    }
  }, [loadRestaurant]);

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        setRestaurant,
        loadingRestaurant,
        loadRestaurant,
        updateRestaurant,
        clearRestaurant,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);

  if (!context) {
    throw new Error(
      "useRestaurant must be used inside RestaurantProvider"
    );
  }

  return context;
};