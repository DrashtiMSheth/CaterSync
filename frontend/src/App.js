import React, { useState } from "react";
import "./AppStyles.css";   // global styles
import LandingPage from "./pages/LandingPage";
import OrganiserLogin from "./pages/OrganiserLogin";
import StaffLogin from "./pages/StaffLogin";
import OrganiserRegistration from "./pages/OrganiserRegistration";
import StaffRegistration from "./pages/StaffRegistration";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import StaffDashboard from "./pages/StaffDashboard";

export default function App() {
  const [route, setRoute] = useState("landing");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // global loading state

  // Navigation function
  function go(page, userData = null) {
    if (userData) setUser(userData);
    setRoute(page);
    setLoading(false); // reset loading on route change
  }

  // Logout function
  function logout() {
    setUser(null);
    setRoute("landing");
  }

  return (
    <>
      {/* Persistent Logout button on dashboards */}
      {(route === "organiser-dashboard" || route === "staff-dashboard") && (
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      )}

      {/* Routes */}
      {route === "landing" && <LandingPage go={go} />}
      {route === "organiser-login" && <OrganiserLogin go={go} loading={loading} setLoading={setLoading} />}
      {route === "staff-login" && <StaffLogin go={go} loading={loading} setLoading={setLoading} />}
      {route === "organiser-register" && <OrganiserRegistration go={go} loading={loading} setLoading={setLoading} />}
      {route === "staff-register" && <StaffRegistration go={go} loading={loading} setLoading={setLoading} />}
      {route === "organiser-dashboard" && <OrganiserDashboard go={go} user={user} />}
      {route === "staff-dashboard" && <StaffDashboard go={go} user={user} />}
    </>
  );
}
