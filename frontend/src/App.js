// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./AppStyles.css";

// Pages
import LandingPage from "./pages/LandingPage";
import OrganiserLogin from "./pages/OrganiserLogin";
import StaffLogin from "./pages/StaffLogin";
import OrganiserRegistration from "./pages/OrganiserRegistration";
import StaffRegistration from "./pages/StaffRegistration";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import StaffDashboard from "./pages/StaffDashboard";

function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/organiser/login" element={<OrganiserLogin />} />
        <Route path="/staff/login" element={<StaffLogin />} />

        <Route path="/organiser/register" element={<OrganiserRegistration />} />
        <Route path="/staff/register" element={<StaffRegistration />} />

        <Route
          path="/organiser"
          element={
            <ProtectedRoute role="organiser">
              <OrganiserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute role="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
