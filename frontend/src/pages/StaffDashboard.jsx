import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { payments } from "../utils/constants";
import Sidebar from "../components/common/Sidebar";
import DashboardCards from "../components/common/DashboardCards";
import UpcomingEventsTable from "../components/staff/UpcomingEventsTable";
import AppliedEventsTable from "../components/staff/AppliedEventsTable";
import PaymentsTable from "../components/staff/PaymentsTable";
import { getStaffProfile, getEvents } from "../api/api";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function StaffDashboard({ bubbleCount = 15 }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [bubbles, setBubbles] = useState([]);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    lat: null,
    lng: null,
    availability: "",
    gender: "",
    languages: [],
    profilePic: null,
    oldPassword: "",
    newPassword: "",
  });

  const [originalProfile, setOriginalProfile] = useState(profile);
  const [markerPosition, setMarkerPosition] = useState({
    lat: profile.lat || 19.07,
    lng: profile.lng || 72.87,
  });

  // Update marker position when profile changes
  useEffect(() => {
    if (profile.lat && profile.lng) {
      setMarkerPosition({ lat: profile.lat, lng: profile.lng });
    }
  }, [profile.lat, profile.lng]);

  // Component to handle marker drag
  const DraggableMarker = () => {
    useMapEvents({
      dragend: (e) => { },
    });
    return (
      <Marker
        draggable
        position={markerPosition}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            setMarkerPosition({ lat: pos.lat, lng: pos.lng });
            setProfile({ ...profile, lat: pos.lat, lng: pos.lng });
          },
        }}
      ></Marker>
    );
  };
  // 
  
// Fetch profile + events on mount
const [loadingProfile, setLoadingProfile] = useState(true);
const [profileError, setProfileError] = useState("");
const [loadingEvents, setLoadingEvents] = useState(true);
const [eventsError, setEventsError] = useState("");

useEffect(() => {
  (async () => {
    try {
      const token = localStorage.getItem("staffToken");
      const data = await getStaffProfile(token);
      const st = data.staff || data;
      setProfile({
        profilePic:
          st.profilePic ||
          "https://media.istockphoto.com/id/1191082076/photo/real-estate-designer-working-on-computer.jpg?s=612x612&w=0&k=20&c=JIwdczkVT71_C8Xrzo23fmpQ-3RQplSoNnZKEiyvYo4=",
        fullName: st.fullName || "",
        email: st.email || "",
        phone: st.phone || "",
        availability: st.availability || "",
        gender: st.gender || "",
        languages: st.languages || [],
      });
      setLoadingProfile(false);
    } catch (err) {
      setProfileError(err?.message || "Failed to load profile");
      setLoadingProfile(false);
    }
    try {
      const token = localStorage.getItem("staffToken");
      await getEvents(token); // backend list; integrate mapping as needed
      setLoadingEvents(false);
    } catch (err) {
      setEventsError(err?.message || "Failed to load events");
      setLoadingEvents(false);
    }
  })();
}, []);

  // Save profile updates
  const handleProfileSave = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5050/api/staff/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (data.success) {
      alert("Profile updated successfully!");
      setProfile(data.staff);
    } else {
      alert("Failed to update profile");
    }
  } catch (err) {
    console.error("Error updating profile:", err);
  }
};


  const handleProfileCancel = () => {
    setProfile(originalProfile); // reset form
  };
  const [mapInstance, setMapInstance] = useState(null); //

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ratingsList, setRatingsList] = useState([]);
  const [appliedEventsList, setAppliedEventsList] = useState([
    { name: "Birthday Party", date: "2025-09-18", status: "Pending Approval" },
    { name: "Conference", date: "2025-09-19", status: "Approved" },
  ]);


  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);

  // Dummy Data
  const notifications = [
    "New event assigned: Wedding Reception",
    "Payment received for Corporate Dinner",
    "Your rating was updated by Event Organizer",
  ];

  // Updated profile with Unsplash image
  const profilee = {
    profilePic:
      "https://images.unsplash.com/photo-1653930351140-d8dca047455e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3RhZmYlMjBpbWFnZXMlMjBmaW5kaW5nJTIwd29ya3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=500",
  };

  // Example ratings from multiple events
  const eventRatings = [4, 5, 3, 4, 5];
  const avgRating =
    eventRatings.length > 0
      ? (eventRatings.reduce((a, b) => a + b, 0) / eventRatings.length).toFixed(1)
      : 0;


  // ---------- Sample Event Data ----------
  const [upcomingEvents] = useState([
    {
      id: 1,
      name: "Wedding Reception",
      startDate: "2025-11-05",
      startTime: "18:00",
      endDate: "2025-11-05",
      endTime: "23:00",
      location: "Banquet Hall A",
      staff: { Waiter: 5, Chef: 2, DJ: 1 },
      status: "Open",
    },
    {
      id: 2,
      name: "Corporate Dinner",
      startDate: "2025-11-07",
      startTime: "19:00",
      endDate: "2025-11-07",
      endTime: "22:00",
      location: "Conference Hall B",
      staff: { Waiter: 3, Cleaner: 2, Anchor: 1 },
      status: "Open",
    },
  ]);

  // ---------- Role Rates ----------
  const roleRates = {
    Waiter: { rate: 50, type: "per hour" },
    Chef: { rate: 100, type: "per hour" },
    Cleaner: { rate: 40, type: "per hour" },
    DJ: { rate: 2000, type: "per event" },
    Anchor: { rate: 10000, type: "per event" },
  };

  // ---------- States ----------
  const [applications, setApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEventUE, setSelectedEventUE] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [warning, setWarning] = useState("");

  // ---------- Utility ----------
  const isTimeOverlap = (start1, end1, start2, end2) => {
    return new Date(start1) < new Date(end2) && new Date(start2) < new Date(end1);
  };

  const getDurationHours = (startDate, startTime, endDate, endTime) => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    return Math.max(hours, 0).toFixed(1);
  };

  const getAppForEvent = (id) => applications.find((a) => a.eventId === id);

  // ---------- Apply ----------
  const handleApplyClick = (event) => {
    const conflict = applications.find((a) => {
      const ev = upcomingEvents.find((e) => e.id === a.eventId);
      if (!ev) return false;
      const evStart = new Date(`${ev.startDate}T${ev.startTime}`);
      const evEnd = new Date(`${ev.endDate}T${ev.endTime}`);
      const newStart = new Date(`${event.startDate}T${event.startTime}`);
      const newEnd = new Date(`${event.endDate}T${event.endTime}`);
      return isTimeOverlap(evStart, evEnd, newStart, newEnd);
    });

    if (conflict) {
      setWarning("⚠️ You already have another event scheduled at this time!");
      return;
    }

    setSelectedEvent(event);
    setSelectedRole("");
    setShowModal(true);
  };

  // ---------- Confirm Apply ----------
  const handleConfirmApply = () => {
    if (!selectedRole) {
      setWarning("⚠️ Please select a role before applying!");
      return;
    }

    const rateData = roleRates[selectedRole];
    const duration = getDurationHours(
      selectedEvent.startDate,
      selectedEvent.startTime,
      selectedEvent.endDate,
      selectedEvent.endTime
    );

    let totalPay = 0;
    if (rateData.type === "per hour") {
      totalPay = rateData.rate * duration;
    } else {
      totalPay = rateData.rate;
    }

    setApplications([
      ...applications,
      {
        eventId: selectedEvent.id,
        role: selectedRole,
        status: "Pending",
        totalPay: totalPay.toFixed(2),
      },
    ]);

    setShowModal(false);
    setWarning("");
  };

  // ---------- Cancel ----------
  const handleCancelApplication = (eventId) => {
    setApplications(applications.filter((a) => a.eventId !== eventId));
  };


  // ---------- Styles ----------
  const pageContainer = {
    fontFamily: "Inter, Arial, sans-serif",
    padding: "20px",
    background: "#f4f6f8",
    minHeight: "100vh",
  };
  const title = { color: "#000", marginBottom: "20px" };
  const warningBox = {
    background: "#fff3cd",
    color: "#856404",
    padding: "10px 15px",
    borderRadius: "8px",
    marginBottom: "15px",
    border: "1px solid #ffeeba",
  };
  const table = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: "10px",
    overflow: "hidden",
  };
  const thead = { background: "#212529", color: "#fff" };
  const th = { padding: "10px", textAlign: "left" };
  const td = { padding: "10px", borderBottom: "1px solid #ddd", color: "#000" };
  const applyBtn = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#007bff",
    color: "#fff",
    cursor: "pointer",
  };
  const cancelBtn = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#dc3545",
    color: "#fff",
    cursor: "pointer",
  };
  const confirmBtn = {
    padding: "6px 12px",
    background: "#28a745",
    color: "#fff",
    borderRadius: "6px",
    border: "none",
  };
  const cancelBtnGray = {
    padding: "6px 12px",
    background: "#6c757d",
    color: "#fff",
    borderRadius: "6px",
    border: "none",
  };
  const selectStyle = {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  };
  const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  };
  const modalBox = {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "340px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  };



  const tdStyleAE = {
    padding: "8px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  };

  const [upcomingEventsAE] = useState([
    {
      name: "Wedding Party",
      startDate: "2025-11-01",
      startTime: "10:00",
      endDate: "2025-11-02",
      endTime: "22:00",
      location: "Sunshine Banquet Hall",
      staff: { waiter: 4, driver: 2 },
      budget: { waiter: 200, driver: 250 },
    },
    {
      name: "Corporate Lunch",
      startDate: "2025-11-05",
      startTime: "12:00",
      endDate: "2025-11-05",
      endTime: "16:00",
      location: "Skyline Tower",
      staff: { server: 3, cleaner: 1 },
      budget: { server: 150, cleaner: 100 },
    },
    {
      name: "Birthday Bash",
      startDate: "2025-11-01",
      startTime: "12:00",
      endDate: "2025-11-01",
      endTime: "20:00",
      location: "Dreamland Resort",
      staff: { waiter: 3, decorator: 1, dj: 1, anchor: 1 },
      budget: { waiter: 180, decorator: 220, dj: 500, anchor: 400 },
    },
    {
      name: "Engagement Event",
      startDate: "2025-11-10",
      startTime: "14:00",
      endDate: "2025-11-10",
      endTime: "22:00",
      location: "Royal Heritage Lawn",
      staff: { chef: 2, cleaner: 1 },
      budget: { chef: 300, cleaner: 100 },
    },
    {
      name: "Music Concert",
      startDate: "2025-11-15",
      startTime: "17:00",
      endDate: "2025-11-15",
      endTime: "23:00",
      location: "City Arena",
      staff: { driver: 2, waiter: 2 },
      budget: { driver: 200, waiter: 150 },
    },
  ]);

  const [appliedEventsListAE, setAppliedEventsListAE] = useState([
    {
      name: "Wedding Party",
      selectedRole: "waiter",
      status: "Applied (Pending Approval)",
      startDate: "2025-11-01",
      startTime: "10:00",
      endDate: "2025-11-02",
      endTime: "22:00",
    },
    {
      name: "Corporate Lunch",
      selectedRole: "server",
      status: "Approved",
      startDate: "2025-11-05",
      startTime: "12:00",
      endDate: "2025-11-05",
      endTime: "16:00",
    },
    {
      name: "Birthday Bash",
      selectedRole: "decorator",
      status: "Rejected",
      startDate: "2025-11-01",
      startTime: "12:00",
      endDate: "2025-11-01",
      endTime: "20:00",
    },
    {
      name: "Engagement Event",
      selectedRole: "chef",
      status: "Cancelled",
      startDate: "2025-11-10",
      startTime: "14:00",
      endDate: "2025-11-10",
      endTime: "22:00",
    },
  ]);

  const [reapplyMode, setReapplyMode] = useState(null);

  // ---------- APPLY / REAPPLY ----------
  const handleApplyAE = (eventName, selectedRole, isReapply = false) => {
    if (!selectedRole) {
      alert("⚠️ Please select a role before applying!");
      return;
    }

    const selectedEvent = upcomingEvents.find((e) => e.name === eventName);
    const eventStart = new Date(`${selectedEvent.startDate} ${selectedEvent.startTime}`);
    const eventEnd = new Date(`${selectedEvent.endDate} ${selectedEvent.endTime}`);

    // Check overlap with other active events (Approved or Pending)
    const overlapping = appliedEventsList.find((a) => {
      if (["Cancelled", "Rejected"].includes(a.status)) return false;
      const prev = upcomingEvents.find((e) => e.name === a.name);
      if (!prev) return false;
      const prevStart = new Date(`${prev.startDate} ${prev.startTime}`);
      const prevEnd = new Date(`${prev.endDate} ${prev.endTime}`);
      return eventStart < prevEnd && eventEnd > prevStart;
    });

    if (overlapping) {
      alert("⚠️ You already have another event scheduled at this time!");
      // ❌ Keep previous Rejected data unchanged (don’t update)
      setReapplyMode(null);
      return;
    }

    if (isReapply) {
      setAppliedEventsList((prev) =>
        prev.map((e) =>
          e.name === eventName
            ? {
              ...e,
              status: "Applied (Pending Approval)",
              selectedRole,
            }
            : e
        )
      );
      setReapplyMode(null);
      alert(`✅ Reapplied successfully for "${eventName}" as ${selectedRole}`);
    } else {
      const alreadyApplied = appliedEventsList.find((e) => e.name === eventName);
      if (alreadyApplied) {
        alert("❌ You’ve already applied for this event!");
        return;
      }

      const newApplication = {
        name: eventName,
        selectedRole,
        status: "Applied (Pending Approval)",
        startDate: selectedEvent.startDate,
        startTime: selectedEvent.startTime,
        endDate: selectedEvent.endDate,
        endTime: selectedEvent.endTime,
      };
      setAppliedEventsList((prev) => [...prev, newApplication]);
      alert(`✅ Applied for "${eventName}" as ${selectedRole}`);
    }
  };

  // ---------- CANCEL ----------
  const handleCancel = (eventName) => {
    if (window.confirm("Are you sure you want to cancel this application?")) {
      setAppliedEventsList((prev) =>
        prev.map((e) =>
          e.name === eventName ? { ...e, status: "Cancelled" } : e
        )
      );
      alert("🕓 Application cancelled successfully.");
    }
  };

  const handleReapplyClick = (eventName) => {
    setReapplyMode(eventName);
  };

  // ---------- TABLE ----------
  const TableAE = ({ columns, data, renderRow }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
      <thead>
        <tr style={{ background: "#000", color: "#fff" }}>
          {columns.map((col, i) => (
            <th key={i} style={{ ...tdStyle, fontWeight: "bold" }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map(renderRow)}</tbody>
    </table>
  );

  // 🧾 Event History Data
  const eventHistory = [
    {
      name: "Music Festival",
      startDate: "2025-09-01",
      startTime: "10:00",
      endDate: "2025-09-01",
      endTime: "18:00",
      location: "Open Ground",
      workedRoles: ["Driving"],
      budget: 2000,
      paymentMode: "Cash",
      organiserReview: "Good work overall",
      status: "Completed",
      paymentReceived: true, // ✅ Paid
    },
    {
      name: "Corporate Gala",
      startDate: "2025-09-05",
      startTime: "19:00",
      endDate: "2025-09-05",
      endTime: "23:00",
      location: "Hotel Ballroom",
      workedRoles: ["Serving"],
      budget: 1500,
      paymentMode: "UPI",
      organiserReview: "Not attended",
      status: "Not Attended",
      paymentReceived: false,
    },
    {
      name: "Festival",
      startDate: "2025-09-10",
      startTime: "08:00",
      endDate: "2025-09-10",
      endTime: "16:00",
      location: "Ground Arena",
      workedRoles: ["Cleaning"],
      budget: 1800,
      paymentMode: "Cash",
      organiserReview: "Average work",
      status: "Completed",
      paymentReceived: false, // ✅ Payment pending
    },
  ];

  // 💰 Calculate Total Earnings (only for paid events)
  const totalEarnings = eventHistory
    .filter((e) => e.paymentReceived)
    .reduce((sum, e) => sum + e.budget, 0);

  console.log("Total Earnings:", totalEarnings);


  useEffect(() => {
    const generated = Array.from({ length: bubbleCount }).map(() => ({
      size: Math.floor(Math.random() * 60) + 20,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setBubbles(generated);
  }, [bubbleCount]);



  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Upcoming Events", icon: "⏳" },
    { name: "Applied Events", icon: "📋" },
    { name: "Event History", icon: "🕒" },
    { name: "Payments", icon: "💰" },
    { name: "Profile", icon: "👤" },
  ];

  // const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

  const thStyle = { padding: 10, textAlign: "center" };
  const tdStyle = { padding: 10, textAlign: "center", verticalAlign: "middle" };

  // Apply for event
  const handleApply = (eventName) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        alert(`Applied for ${eventName} at location:\nLat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
        const event = upcomingEvents.find(e => e.name === eventName);
        setAppliedEventsList((prev) => [...prev, { name: event.name, date: event.startDate, status: "Pending Approval" }]);
      },
      () => alert("Unable to retrieve your location. Please allow location access.")
    );
  };


  const handleSubmitRating = (e) => {
    e.preventDefault();
    alert(`Thanks for rating! ⭐${rating}\nReview: ${review}`);
    setRating(0);
    setReview("");
  };

  // Table Components
  const Table = ({ columns, data, renderRow }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
      <thead>
        <tr style={{ background: "#111827", color: "#fff" }}>
          {columns.map((col, i) => <th key={i} style={thStyle}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map(renderRow)}
      </tbody>
    </table>
  );


  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "Arial,sans-serif", position: "relative", overflow: "hidden",
      background: "rgba(255, 255, 255, 0.9)", backgroundSize: "600% 600%"
    }}>

      {/* ---- Bubble/Color Effect ---- */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: `-${b.size}px`,
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            borderRadius: "50%",
            background: `rgba(255,255,255,0.8)`,
            opacity: b.opacity,
            animation: `floatUp ${b.duration}s linear ${b.delay}s infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} items={menuItems} active={activeTab} onToggle={() => setSidebarOpen(!sidebarOpen)} onSelect={(name) => setActiveTab(name)} />

      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {/* Header */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "15px 20px",
            background: "#f3f4f6",
            borderRadius: "12px",
            marginBottom: 25,
            boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          }}
        >
          {/* Left side */}
          <h2 style={{ margin: 0, color: "#111827", fontWeight: "700" }}>
            Staff Dashboard
          </h2>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* ⭐ Rating */}
            <div
              style={{
                background: "#fef3c7",
                color: "#b45309",
                padding: "6px 14px",
                borderRadius: 20,
                fontWeight: "bold",
                fontSize: 14,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              ⭐ {avgRating} / 5
            </div>

            {/* 🔔 Notifications */}
            <div
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfilePreview(false);
              }}
            >
              <span style={{ fontSize: 20 }}>🔔</span>
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-8px",
                  background: "#ef4444",
                  color: "#000",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                {notifications.length}
              </span>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "35px",
                    right: 0,
                    width: "280px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      padding: "10px",
                      fontWeight: "bold",
                      borderBottom: "1px solid #eee",
                      background: "#f9fafb",
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                      color: "#111827",
                    }}
                  >
                    Notifications
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((note, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px",
                          borderBottom:
                            idx !== notifications.length - 1
                              ? "1px solid #f1f1f1"
                              : "none",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        {note}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "10px", color: "#999" }}>
                      No new notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 👤 Profile Picture */}
            <div
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => {
                setShowProfilePreview(!showProfilePreview);
                setShowNotifications(false);
              }}
            >
              <img
                src={
                  profilee?.profilePic ||
                  "https://images.unsplash.com/photo-1653930351140-d8dca047455e?ixlib=rb-4.1.0&auto=format&fit=crop&q=60&w=500"
                }
                alt="Profile"
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #d1d5db",
                  boxShadow: "0 0 4px rgba(0,0,0,0.1)",
                }}
              />
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                localStorage.removeItem("organiserToken");
                localStorage.removeItem("staffToken");
                localStorage.removeItem("token");
                window.location.href = "/";
              }}
              style={{
                background: "#111827",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "600",
                transition: "background 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.background = "#1f2937")}
              onMouseOut={(e) => (e.target.style.background = "#111827")}
            >
              Logout
            </button>
          </div>

          {/* Fullscreen Profile Preview */}
          {showProfilePreview && (
            <div
              onClick={() => setShowProfilePreview(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
                cursor: "pointer",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  textAlign: "center",
                  boxShadow: "0 6px 25px rgba(0,0,0,0.3)",
                  width: "360px",
                  cursor: "default",
                }}
              >
                <img
                  src={
                    profilee?.profilePic ||
                    "https://images.unsplash.com/photo-1653930351140-d8dca047455e?ixlib=rb-4.1.0&auto=format&fit=crop&q=60&w=500"
                  }
                  alt="Profile Preview"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                />
              </div>
            </div>
          )}
        </div>



        {activeTab === "Dashboard" && (
          <>
            {/* Dashboard Cards */}
            <DashboardCards
              cards={[
                { title: "Upcoming Events", count: upcomingEvents.length },
                { title: "Applied Events", count: appliedEventsList.length },
                { title: "Payments", value: `$${totalEarnings}` },
              ]}
              active={activeTab}
              onClick={(title) => setActiveTab(title)}
            />
          </>
        )}


        {/* Tabs */}
        {activeTab === "Upcoming Events" && (
          <div style={pageContainer}>
            <h2 style={title}>Upcoming Events</h2>
            {warning && <div style={warningBox}>{warning}</div>}
            {loadingEvents && <div>Loading events…</div>}
            {eventsError && <div style={{ color: "#b91c1c" }}>{eventsError}</div>}
            {!loadingEvents && !eventsError && (
              <UpcomingEventsTable
                events={upcomingEvents}
                roleRates={roleRates}
                onApplyClick={handleApplyClick}
                getAppForEvent={getAppForEvent}
                onCancel={handleCancelApplication}
              />
            )}

            {/* Role Selection Modal */}
            {showModal && selectedEvent && (
              <div style={modalOverlay}>
                <div style={modalBox}>
                  <h3>Apply for: {selectedEvent.name}</h3>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">-- Select Role --</option>
                    {Object.keys(selectedEvent.staff).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {selectedRole && (
                    <div style={{ marginBottom: 15, color: "#333" }}>
                      💰 <b>Rate:</b> ${roleRates[selectedRole].rate} (
                      {roleRates[selectedRole].type}) <br />
                      {roleRates[selectedRole].type === "per hour" && (
                        <>
                          ⏱ <b>Duration:</b>{" "}
                          {getDurationHours(
                            selectedEvent.startDate,
                            selectedEvent.startTime,
                            selectedEvent.endDate,
                            selectedEvent.endTime
                          )}{" "}
                          hrs <br />
                          💵 <b>Total Pay:</b> $
                          {(
                            roleRates[selectedRole].rate *
                            getDurationHours(
                              selectedEvent.startDate,
                              selectedEvent.startTime,
                              selectedEvent.endDate,
                              selectedEvent.endTime
                            )
                          ).toFixed(2)}
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={() => setShowModal(false)} style={cancelBtnGray}>
                      Close
                    </button>
                    <button onClick={handleConfirmApply} style={confirmBtn}>
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Applied Events" && (
          <>
            <h3 style={{ textAlign: "left", marginBottom: 10, color: "#222" }}>Staff Event Application</h3>
            <AppliedEventsTable
              data={upcomingEventsAE.map((event) => ({ ...event, applied: appliedEventsListAE.find((a) => a.name === event.name) }))}
              onCancel={handleCancel}
              onReapply={handleReapplyClick}
              reapplyMode={reapplyMode}
              onConfirmReapply={(name, role) => handleApply(name, role, true)}
              availableRoles={(event, applied) => applied?.status === "Rejected" ? Object.keys(event.staff).filter((r) => r !== applied.selectedRole) : Object.keys(event.staff)}
            />
          </>
        )}

        {activeTab === "Event History" && (
          <>
            <h3 style={{ textAlign: "left", marginBottom: 10, color: "#222" }}>Event History</h3>
            <Table
              columns={["Event Name", "Start", "End", "Location", "Worked Roles", "Budget", "Payment Mode", "Organiser Review", "Status"]}
              data={eventHistory}
              renderRow={(event, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
                  <td style={tdStyle}>{event.name}</td>
                  <td style={tdStyle}>{event.startDate} {event.startTime}</td>
                  <td style={tdStyle}>{event.endDate} {event.endTime}</td>
                  <td style={tdStyle}>{event.location}</td>
                  <td style={tdStyle}>{event.workedRoles || "N/A"}</td>
                  <td style={tdStyle}>${event.budget}</td>
                  <td style={tdStyle}>{event.paymentMode}</td>
                  <td style={tdStyle}>{event.organiserReview}</td>
                  <td style={tdStyle}>{event.status}</td>
                </tr>
              )}
            />
          </>
        )}

        {activeTab === "Payments" && (
          <div>
            <h3 style={{ textAlign: "left", marginBottom: 10, color: "#222", fontSize: "20px", fontWeight: "600", letterSpacing: "0.5px" }}>
              Total Earnings: ${eventHistory.filter((e) => e.paymentReceived).reduce((sum, e) => sum + (e.budget || 0), 0)}
            </h3>
            <PaymentsTable
              rows={eventHistory.map((event) => ({
                event: event.name,
                startDate: event.startDate,
                startTime: event.startTime,
                location: event.location,
                workedRole: Array.isArray(event.workedRoles) ? event.workedRoles[0] : event.workedRoles || "N/A",
                budget: event.budget,
                paymentMode: event.status?.toLowerCase() === "completed" && !event.paymentReceived ? "" : event.paymentMode,
                status: event.status,
                paymentReceived: event.paymentReceived,
              }))}
              onRequestPayment={(p) => alert(`Payment request sent to organiser for ${p.event}`)}
            />
          </div>
        )}


        {activeTab === "Profile" && (
          <div
            style={{
              width: "100%",
              margin: "0",
              padding: 20,
              background: "#f9fafb",
              borderRadius: 8,
              minHeight: "100vh",
              color: "#000",
            }}
          >
            <h3>Profile</h3>

            {/* Profile Picture */}
            <label>Profile Picture:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfile({ ...profile, profilePic: e.target.files[0] })}
              style={{ width: "100%", marginBottom: 10 }}
            />
            {profile.profilePic && (
              <img
        src={
          profile.profilePic
            ? typeof profile.profilePic === "string"
              ? profile.profilePic
              : URL.createObjectURL(profile.profilePic)
            : "https://media.istockphoto.com/id/1191082076/photo/real-estate-designer-working-on-computer.jpg?s=612x612&w=0&k=20&c=JIwdczkVT71_C8Xrzo23fmpQ-3RQplSoNnZKEiyvYo4="
        }
        alt="Profile"
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          marginBottom: 10,
        }}
      />
            )}
            <br/>

            {/* Full Name */}
            <label>Full Name:</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />

            {/* Email */}
            <label>Email:</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />

            {/* Phone */}
            <label>Phone:</label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />


            {/* Availability */}
            <label>Availability:</label>
            <input
              type="text"
              value={profile.availability}
              onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />

            {/* Gender */}
            <label>Gender:</label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* Languages */}
            <label>Languages (comma separated):</label>
            <input
              type="text"
              value={profile.languages.join(", ")}
              onChange={(e) =>
                setProfile({ ...profile, languages: e.target.value.split(",") })
              }
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />

            {/* Password */}
            <label>Old Password:</label>
            <input
              type="password"
              value={profile.oldPassword || ""}
              onChange={(e) => setProfile({ ...profile, oldPassword: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />
            <label>New Password:</label>
            <input
              type="password"
              value={profile.newPassword || ""}
              onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
              style={{ width: "100%", marginBottom: 10, padding: 6 }}
            />

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleProfileSave}
                style={{
                  padding: "8px 16px",
                  background: "#3b82f6",
                  color: "#fff",
                  borderRadius: 4,
                  border: "none",
                }}
              >
                Save
              </button>
              <button
                onClick={handleProfileCancel}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 4,
                  border: "none",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bubble animation */}
        <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-120vh); }
        }
      `}</style>

      </div>
    </div>
  );
}
