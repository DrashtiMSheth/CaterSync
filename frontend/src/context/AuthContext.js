// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import socket from "../utils/socket";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const isAuthenticated = useMemo(() => !!token, [token]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // Emit login event
    if (userData?.email) {
      socket.emit("user-login", { email: userData.email, role: userData.role });
    }
    // Join personal room for targeted notifications
    const userId = userData?.id || userData?._id;
    if (userId) {
      socket.emit("joinRoom", { userId });
    }
  };

  const logout = () => {
    const currentUser = user; // save before clearing
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Emit logout
    if (currentUser?.email) {
      socket.emit("user-logout", { email: currentUser.email, role: currentUser.role });
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") setToken(e.newValue);
      if (e.key === "user") setUser(e.newValue ? JSON.parse(e.newValue) : null);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
