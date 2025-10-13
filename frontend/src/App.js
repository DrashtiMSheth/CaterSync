// src/App.js
import React, { useState, useEffect } from "react";
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

export default function App() {
  const { user, logout } = useAuth();
  const [route, setRoute] = useState("landing");
  const [loading, setLoading] = useState(false);

  // On initial load, check user role and auto-route
  useEffect(() => {
    if (user) {
      if (user.role === "organiser") setRoute("organiser-dashboard");
      else if (user.role === "staff") setRoute("staff-dashboard");
    } else {
      setRoute("landing");
    }
  }, [user]);

  // Navigation helper
  const go = (page) => {
    setRoute(page);
    setLoading(false);
  };

  // Render current route
  const renderPage = () => {
    switch (route) {
      case "landing":
        return <LandingPage go={go} />;
      case "organiser-login":
        return <OrganiserLogin go={go} loading={loading} setLoading={setLoading} />;
      case "staff-login":
        return <StaffLogin go={go} loading={loading} setLoading={setLoading} />;
      case "organiser-register":
        return <OrganiserRegistration go={go} loading={loading} setLoading={setLoading} />;
      case "staff-register":
        return <StaffRegistration go={go} loading={loading} setLoading={setLoading} />;
      case "organiser-dashboard":
        return <OrganiserDashboard go={go} />;
      case "staff-dashboard":
        return <StaffDashboard go={go} />;
      default:
        return <LandingPage go={go} />;
    }
  };

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  );
}
