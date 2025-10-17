import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import socket from "../utils/socket";
import { getEvents, getAllStaff } from "../api/api";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Utility for distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map Updater
function MapUpdater({ lat, lon }) {
  const map = useMap();
  map.setView([lat, lon], 12);
  return null;
}

// Map Click Selector
function LocationSelector({ form, setForm }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setForm({ ...form, lat, lon: lng });
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.display_name) setForm((f) => ({ ...f, location: data.display_name }));
        });
    },
  });
  return null;
}

export default function OrganiserDashboard({ bubbleCount = 25 }) {
  // const initialStaff = [
  //   { id: 1, name: "Alice", rating: 4, payment: 100, lat: 19.07, lon: 72.87, ratingsByOrganiser: {}, ratingsForOrganiser: [] },
  //   { id: 2, name: "Bob", rating: 3, payment: 80, lat: 19.05, lon: 72.88, ratingsByOrganiser: {}, ratingsForOrganiser: [] },
  //   { id: 3, name: "Charlie", rating: 5, payment: 120, lat: 19.1, lon: 72.85, ratingsByOrganiser: {}, ratingsForOrganiser: [] },
  // ];

  const initialEvents = [
    { id: 1, name: "Event A", startDate: "2025-09-20", endDate: "2025-09-20", priority: "High", required: 10, applied: 10, lat: 19.06, lon: 72.86, staff: {}, specialReqs: [], attachments: [] },
    { id: 2, name: "Event B", startDate: "2025-09-22", endDate: "2025-09-22", priority: "Medium", required: 5, applied: 5, lat: 19.08, lon: 72.84, staff: {}, specialReqs: [], attachments: [] },
  ];

  const todayStr = new Date().toISOString().split("T")[0];
  // Styling
const thStyle = {
  padding: "12px",
  border: "1px solid #ccc",
  backgroundColor: "#f3f4f6",
  fontWeight: "bold",
  textAlign: "left",
};

const tdStyle = {
  padding: "12px",
  border: "1px solid #ccc",
  verticalAlign: "top",
};

  const initialForm = {
    eventName: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
    lat: 19.07,
    lon: 72.87,
    budget: 0,
    staff: {},
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [events, setEvents] = useState([]);
  // const [staff] = useState(initialStaff);
  const [bubbles, setBubbles] = useState([]);
  const [showCreatePage, setShowCreatePage] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "apply", message: "Alice applied for Event A", staff: "Alice", event: "Event A", status: "pending", createdAt: Date.now() - 1000 * 60 * 60 },
    { id: 2, type: "rating", message: "Bob rated your organisation ⭐ 4", staff: "Bob", status: "info", createdAt: Date.now() - 1000 * 60 * 30 },
    { id: 3, type: "warning", message: "Charlie tried to apply twice for Event B", status: "warning", createdAt: Date.now() - 1000 * 60 * 5 },
    { id: 4, type: "apply", message: "Alice applied for Event A", staff: "Alice", event: "Event A", status: "pending", createdAt: Date.now() - 1000 * 60 * 60 },
    { id: 5, type: "rating", message: "Bob rated your organisation ⭐ 4", staff: "Bob", status: "info", createdAt: Date.now() - 1000 * 60 * 30 },
    { id: 6, type: "warning", message: "Charlie tried to apply twice for Event B", status: "warning", createdAt: Date.now() - 1000 * 60 * 5 },
    { id: 7, type: "apply", message: "Alice applied for Event A", staff: "Alice", event: "Event A", status: "pending", createdAt: Date.now() - 1000 * 60 * 60 },
    { id: 8, type: "rating", message: "Bob rated your organisation ⭐ 4", staff: "Bob", status: "info", createdAt: Date.now() - 1000 * 60 * 30 },
    { id: 9, type: "warning", message: "Charlie tried to apply twice for Event B", status: "warning", createdAt: Date.now() - 1000 * 60 * 5 },
  ]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffRatings, setStaffRatings] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRating, setStaffRating] = useState(0);
  const [staffReview, setStaffReview] = useState("");
  const [staffPayment, setStaffPayment] = useState(0);
  const handleDeleteRating = (index) => {
    setStaffRatings(prev => prev.filter((_, i) => i !== index));
  };
  const [editingEvent, setEditingEvent] = useState(null);
  const [applications, setApplications] = useState([]); // holds staff applications
  const [staff, setStaff] = useState([]); // fetched via API instead of static list
  // const [colorMode, setColorMode] = useState(false);
  const [activeSpecialRole, setActiveSpecialRole] = useState(null);

  const roles = [
    "Waiter", "Chef", "Driver", "Cleaner", "Supervisor",
    "Decorator", "Photographer", "Videographer", "DJ", "Anchor"
  ];

  const specialRequirements = {
    "Waiter": ["Gluten-Free", "Vegan", "Allergy Awareness", "Customer Experience", "Quick Service", "Smart POS Handling", "Professional Appearance"],
    "Chef": ["Gluten-Free", "Vegan", "Allergy Awareness", "Culinary Innovation", "Food Safety Certification", "Menu Customization", "Efficient Workflow"],
    "Driver": ["Vehicle Type", "GPS Knowledge", "Experienced", "Night Shift", "Safety & Compliance", "On-Time Performance", "Event Traffic Awareness"],
    "Cleaner": ["Eco-Friendly Products", "Experienced", "Night Shift", "Quick Cleaning", "Hygiene & Safety Standards", "Sanitization Expertise", "Attention to Detail"],
    "Supervisor": ["Experience", "Multi-Role", "Leadership", "Night Shift", "Certification", "Team Coordination", "Real-Time Decision Making"],
    "Decorator": ["Floral", "Lighting", "Theme-Based", "Creative", "Experienced", "Modern Aesthetic Sense", "Event Branding Awareness"],
    "Photographer": ["Wedding", "Corporate", "Birthday", "Drone", "Experienced", "Event Storytelling", "Social Media Ready Shots", "Adaptable to Event Types"],
    "Videographer": ["Wedding", "Corporate", "Drone", "Editing Skills", "Experienced", "Cinematic Videography", "Content Optimization for Social Media", "Adaptability"],
    "DJ": ["Genre Speciality", "Equipment Own", "Night Shift", "Experienced", "Crowd Control", "Live Mixing Skills", "Event Mood Setting"],
    "Anchor": ["Bilingual", "Stage Experience", "Emcee", "Corporate", "Wedding", "Audience Engagement", "Event Flow Management", "Public Speaking"]
  };

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleStaffChange = (role, field, value) => {
    const numValue = Number(value);
    setForm(prev => {
      const updatedStaff = {
        ...prev.staff,
        [role]: { ...prev.staff[role], [field]: numValue }
      };

      if (field !== "budget") {
        setActiveSpecialRole(role);
      }

      const male = updatedStaff[role].male || 0;
      const female = updatedStaff[role].female || 0;
      if (male === 0 && female === 0) {
        delete updatedStaff[role].specialReq;
        if (activeSpecialRole === role) setActiveSpecialRole(null);
      }

      return { ...prev, staff: updatedStaff };
    });
  };

  const handleSpecialReqChange = (role, selectedOptions) => {
    setForm(prev => ({
      ...prev,
      staff: {
        ...prev.staff,
        [role]: { ...prev.staff[role], specialReq: selectedOptions }
      }
    }));
  };

  const handleCommentChange = (role, value) => {
    setForm(prev => ({
      ...prev,
      staff: {
        ...prev.staff,
        [role]: { ...prev.staff[role], comments: value }
      }
    }));
  };

  const handleDJAnchorSelect = (role, gender) => {
  setForm(prev => {
    const current = prev.staff[role] || {};
    const isSelected =
      (gender === "male" && current.male === 1) ||
      (gender === "female" && current.female === 1);

    // Toggle selection: deselect if already selected
    const updatedStaff = {
      ...prev.staff,
      [role]: isSelected
        ? { male: 0, female: 0 } // deselect
        : { male: gender === "male" ? 1 : 0, female: gender === "female" ? 1 : 0 }, // select
    };

    // Remove specialReq if both male & female are 0
    const male = updatedStaff[role].male || 0;
    const female = updatedStaff[role].female || 0;
    if (male === 0 && female === 0) {
      delete updatedStaff[role].specialReq;
      setActiveSpecialRole(null); // close popup when deselected
    } else {
      setActiveSpecialRole(role); // open popup when selected
    }

    return { ...prev, staff: updatedStaff };
  });
};


  const handleSubmit = () => {
    console.log("Form submitted:", form);
    setShowCreatePage(false);
  };

  const closeSpecialPopup = () => setActiveSpecialRole(null);

  const totalStaffCount = Object.values(form.staff).reduce((total, staffData) => {
    const male = staffData.male || 0;
    const female = staffData.female || 0;
    const count = staffData.count || 0;
    const selected = staffData.selected ? 1 : 0;
    return total + male + female + count + selected;
  }, 0);

  // Updated totalBudget calculation for all roles
  const totalBudget = Object.values(form.staff).reduce((total, staffData) => {
    const male = staffData.male || 0;
    const female = staffData.female || 0;
    const count = male + female;
    const budgetPerPerson = staffData.budget || 0;
    const hours = 1; // You can change if you want
    return total + budgetPerPerson * count * hours;
  }, 0);

  const handleEditRating = (index) => {
    const r = staffRatings[index];
    setStaffSearch(r.name);
    setStaffRating(r.rating);
    setStaffReview(r.review);
    setStaffPayment(r.payment);
    setStaffRatings(prev => prev.filter((_, i) => i !== index));
  };

  const handleEventEdit = async (id, updatedEvent) => {
    try {
      const token = localStorage.getItem("organiserToken");
      // Fallback to axios with BASE when we add an API helper
      await axios.put(`${process.env.REACT_APP_API_URL || "http://localhost:5050/api"}/events/${id}`,
        updatedEvent,
        { headers: { "x-auth-token": token, "Content-Type": "application/json" } }
      );
      setEvents(prev => prev.map(e => (e.id === id ? updatedEvent : e)));
    } catch (err) {
      console.error("Failed to update event", err);
    }
  };


  // State for filters & sorting
  const [filterEvent, setFilterEvent] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Example reviews data (replace with DB/API data later)
  const [reviews] = useState([
    { staff: "Alice", event: "Event A", rating: 5, review: "Amazing organiser, smooth experience.", date: "2025-09-25" },
    { staff: "Bob", event: "Event B", rating: 4, review: "Well managed but could improve payments.", date: "2025-09-22" },
    { staff: "Charlie", event: "Event A", rating: 3, review: "Average experience, some miscommunication.", date: "2025-09-20" },
  ]);

  // Sorting logic
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortOption === "newest") return new Date(b.date) - new Date(a.date);
    if (sortOption === "oldest") return new Date(a.date) - new Date(b.date);
    if (sortOption === "highest") return b.rating - a.rating;
    if (sortOption === "lowest") return a.rating - b.rating;
    return 0;
  });



  const today = new Date().toISOString().split("T")[0];
  const filteredEvents = events.filter((event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate || event.startDate);
    const now = new Date(today);

    if (activeTab === "Current Events") {
      return start <= now && end >= now;
    }
    if (activeTab === "Upcoming Events") {
      return start > now;
    }
    return true;
  });


  // const organiserAvgRating = () => {
  //   const allRatings = staff.flatMap((s) => s.ratingsForOrganiser);
  //   if (allRatings.length === 0) return 0;
  //   return (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1);
  // };

  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Current Events", icon: "📅" },
    { name: "Events History", icon: "⏳" },
    { name: "Staff Applications", icon: "📄" },
    { name: "Staff List", icon: "👥" },
    { name: "Ratings", icon: "⭐" },
    { name: "Profile", icon: "👤" },
  ];

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

  useEffect(() => {
    // Fetch staff + events on mount
    // Use central API helpers so BASE and headers are consistent
    (async () => {
      try {
        const token = localStorage.getItem("organiserToken");
        const staffRes = await getAllStaff(token);
        setStaff(staffRes?.staff || staffRes || []);
      } catch (e) {
        console.error("Failed to fetch staff", e);
      }
      try {
        const token = localStorage.getItem("organiserToken");
        const eventsRes = await getEvents(token);
        setEvents(eventsRes?.events || eventsRes || []);
      } catch (e) {
        console.error("Failed to fetch events", e);
      }
    })();

    // SOCKET EVENTS
    socket.on("staffApplied", (data) => {
      // Only add if not duplicate
      setApplications(prev => {
        if (prev.some(a => a.staffId === data.staffId && a.eventId === data.eventId)) return prev;
        return [...prev, data];
      });

      // Notification (newest first)
      setNotifications(prev => [
        { id: Date.now(), type: "apply", message: `${data.staffName} applied for ${data.eventName}`, status: "pending", createdAt: Date.now() },
        ...prev,
      ]);
    });

    socket.on("staffCancelled", (data) => {
      setApplications(prev => prev.filter(a => a.staffId !== data.staffId));
      setNotifications(prev => [
        { id: Date.now(), type: "cancel", message: `${data.staffName} cancelled their application`, status: "info", createdAt: Date.now() },
        ...prev,
      ]);
    });

    socket.on("eventUpdated", (data) => {
      setNotifications(prev => [
        { id: Date.now(), type: "update", message: `${data.eventName} was updated (${data.changeType})`, status: "info", createdAt: Date.now() },
        ...prev,
      ]);
    });

    socket.on("ratingReceived", (data) => {
      setNotifications(prev => [
        { id: Date.now(), type: "rating", message: `${data.staffName} rated you ⭐ ${data.rating}`, status: "info", createdAt: Date.now() },
        ...prev,
      ]);
    });

    return () => socket.disconnect();
  }, []);


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("organiserToken");
        const res = await getEvents(token);
        setEvents(res?.events || res || []);
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };

    fetchEvents();
  }, []);


  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      const data = await res.json();
      if (data.length > 0) {
        setForm({ ...form, location: data[0].display_name, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      } else alert("Location not found");
    } catch { alert("Error fetching location"); }
  };

  const handleAccept = (id) => {
    setNotifications(prev => {
      const accepted = prev.find(n => n.id === id);
      const rest = prev.filter(n => n.id !== id);
      if (!accepted) return prev;
      // Keep in list, mark as accepted, move to top
      return [{ ...accepted, status: "accepted", message: `${accepted.message} — accepted` }, ...rest];
    });
    alert("Application Accepted ✅");
  };
  const handleReject = (id) => {
    setNotifications(prev => {
      const rejected = prev.find(n => n.id === id);
      const rest = prev.filter(n => n.id !== id);
      if (!rejected) return prev;
      // Keep in list, mark as rejected, move to top
      return [{ ...rejected, status: "rejected", message: `${rejected.message} — rejected` }, ...rest];
    });
    alert("Application Rejected ❌");
  };

  const handleRating = async (staffId, rating) => {
    try {
      const token = localStorage.getItem("organiserToken");
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5050/api"}/staff/${staffId}/rating`, { rating },
        { headers: { "x-auth-token": token, "Content-Type": "application/json" } }
      );
      setStaff(prev =>
        prev.map(s => (s.id === staffId ? { ...s, rating } : s))
      );
    } catch (err) {
      console.error("Failed to update rating", err);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem("organiserToken");
      await axios.put(`${process.env.REACT_APP_API_URL || "http://localhost:5050/api"}/organiser/profile`, form,
        { headers: { "x-auth-token": token, "Content-Type": "application/json" } }
      );
      alert("Profile updated!");
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };


  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "Arial,sans-serif", position: "relative", overflow: "hidden",
      background: "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)", backgroundSize: "600% 600%"
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
      <div style={{ width: sidebarOpen ? 220 : 60, background: "#1f2937", color: "#fff", transition: "width 0.3s", display: "flex", flexDirection: "column", zIndex: 2 }}>
        <button style={{ margin: 10, background: "#374151", color: "#fff", border: "none", padding: 10, cursor: "pointer" }} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        {menuItems.map(item => (<div key={item.name} onClick={() => { setActiveTab(item.name); setShowCreatePage(false) }} style={{
          padding: 15, cursor: "pointer",
          background: activeTab === item.name ? "#111827" : "transparent",
          display: "flex", alignItems: "center", gap: sidebarOpen ? 10 : 0, justifyContent: sidebarOpen ? "flex-start" : "center", whiteSpace: "nowrap", overflow: "hidden", transition: "background 0.3s" // optional: smooth effect
        }}><span>{item.icon}</span>{sidebarOpen && <span>{item.name}</span>}</div>))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 20, background: "rgba(255,255,255,0.9)", overflowY: "scroll", zIndex: 1, color: "#000" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, padding: "4px 8px", borderBottom: "1px solid #e5e7eb", background: "#fff", marginBottom: 10 }}>
          <div style={{ background: "#fef3c7", color: "#b45309", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" }}>
            ⭐ {reviews.length > 0
              ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
              : "0"} / 5          </div>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 18, cursor: "pointer" }} onClick={() => setShowDropdown(true)}>🔔</span>
            {notifications.length > 0 && <span style={{ position: "absolute", top: -5, right: -5, background: "red", color: "#fff", borderRadius: "50%", fontSize: "12px", padding: "2px 6px" }}>{notifications.length}</span>}
          </div>
          <img
            src={form.companyLogo ? URL.createObjectURL(form.companyLogo) : "https://i.pravatar.cc/150"}
            alt="profile"
            style={{ borderRadius: "50%", width: 80, height: 80, cursor: "pointer" }}
            onClick={() => setShowProfilePreview(true)}
          />


          <button
            onClick={() => {
              localStorage.removeItem("organiserToken");
              localStorage.removeItem("staffToken");
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            style={{ background: "#374151", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 5, cursor: "pointer", fontWeight: "bold" }}
          >
            Logout
          </button>
        </div>

        {/* Dashboard Cards */}
        {activeTab === "Dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: "15px" }}>
              {[
                { title: "Current Events", count: events.filter((e) => new Date(e.startDate) <= new Date(today) && new Date(e.endDate || e.startDate) >= new Date(today)).length },
                { title: "Upcoming Events", count: events.filter((e) => new Date(e.startDate) > new Date(today)).length },
                { title: "Staff List", count: staff.length }
              ].map((card) => (
                <div
                  key={card.title}
                  onClick={() => setActiveTab(card.title)}
                  style={{
                    flex: 1,
                    minWidth: "150px",
                    padding: "20px",
                    background: activeTab === card.title ? "#10b981" : "#fff",
                    borderRadius: 8,
                    textAlign: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 120,
                    color: activeTab === card.title ? "#fff" : "#000",
                    transition: "0.3s"
                  }}
                >
                  <div style={{ fontSize: 30, fontWeight: "bold" }}>{card.count}</div>
                  <div style={{ fontSize: 16, marginTop: 10 }}>{card.title}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCreatePage(true)} style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", marginBottom: 20 }}>+ Create New Event</button>
          </>
        )}

        {/* Events Table */}
        {(activeTab === "Current Events" || activeTab === "Upcoming Events") && (
          <div style={{ overflowX: "auto" }}>
            {filteredEvents.length === 0 ? (
              <div>No events</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Event Name</th>
                    <th style={thStyle}>Start Date</th>
                    <th style={thStyle}>Start Time</th>
                    <th style={thStyle}>End Date</th>
                    <th style={thStyle}>End Time</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Priority</th>
                    <th style={thStyle}>Staff</th>
                    <th style={thStyle}>Budget</th>
                    <th style={thStyle}>Payment Mode</th>
                    <th style={thStyle}>Attachments</th>
                    <th style={thStyle}>Progress</th>
                    {activeTab === "Upcoming Events" && <th style={thStyle}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents
                    .filter((event) =>
                      activeTab === "Upcoming Events"
                        ? event.startDate > todayStr
                        : event.startDate <= todayStr
                    )
                    .map((event) => (
                      <tr key={event.id}>
                        <td style={tdStyle}>{event.name}</td>
                        <td style={tdStyle}>
                          {event.startDateTime ? event.startDateTime.replace("T", " ") : "-"}
                        </td>
                        <td style={tdStyle}>
                          {event.endDateTime ? event.endDateTime.replace("T", " ") : "-"}
                        </td>
                        <td style={tdStyle}>{event.location || "-"}</td>
                        <td style={tdStyle}>{event.priority || "-"}</td>
                        <td style={tdStyle}>
                          {Object.entries(event.staff || {}).map(([role, count]) => (
                            <div key={role}>
                              {role}: {count}
                            </div>
                          ))}
                        </td>
                        <td style={tdStyle}>${event.budget || 0}</td>
                        <td style={tdStyle}>{event.paymentMode || "-"}</td>
                        <td style={tdStyle}>
                          {event.attachments ? event.attachments.length + " file(s)" : 0}
                        </td>
                        <td style={{ width: "200px" }}>
                          <div style={{ background: "#eee", borderRadius: "8px", height: "20px" }}>
                            <div
                              style={{
                                width: `${Math.min((event.applied / event.required) * 100, 100)}%`,
                                background:
                                  event.applied === 0 ? "#9ca3af" :
                                    event.applied < event.required ? "#3b82f6" :
                                      "#10b981",
                                height: "100%",
                                borderRadius: "8px",
                                transition: "width 0.3s ease",
                              }}
                            ></div>
                          </div>
                        </td>

                        {activeTab === "Upcoming Events" && (
                          <td>
                            <button onClick={() => setEditingEvent(event)}>Edit</button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Edit Event Modal */}
        {editingEvent && activeTab === "Upcoming Events" && (
          <div style={{ marginTop: "20px", padding: "10px", border: "1px solid black" }}>
            <h3>Edit Event: {editingEvent.name}</h3>
            <label>
              Name:{" "}
              <input
                type="text"
                value={editingEvent.name}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, name: e.target.value })
                }
              />
            </label>
            <br />
            <label>
              Start Date & Time:
              <input
                type="datetime-local"
                value={editingEvent.startDateTime || ""}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, startDateTime: e.target.value })
                }
              />
            </label>
            <br />
            <label>
              End Date & Time:
              <input
                type="datetime-local"
                value={editingEvent.endDateTime || ""}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, endDateTime: e.target.value })
                }
              />
            </label>

            <br />
            <label>
              Location:{" "}
              <input
                type="text"
                value={editingEvent.location || ""}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, location: e.target.value })
                }
              />
            </label>
            <br />
            <label>
              Priority:{" "}
              <input
                type="number"
                value={editingEvent.priority || 1}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, priority: parseInt(e.target.value, 10) })
                }
              />
            </label>
            <br />
            <label>
              Staff:{" "}
              <input
                type="text"
                value={editingEvent.staff || ""}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, staff: e.target.value })
                }
              />
            </label>
            <br />
            <label>
              Budget:{" "}
              <input
                type="number"
                value={editingEvent.budget || 0}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, budget: parseInt(e.target.value, 10) })
                }
              />
            </label>
            <br />
            <label>
              Payment Mode:{" "}
              <input
                type="text"
                value={editingEvent.paymentMode || ""}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, paymentMode: e.target.value })
                }
              />
            </label>
            <br />
            <label>
              Attachments:{" "}
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    attachments: Array.from(e.target.files),
                  })
                }
              />
            </label>
            <br />
            <button
              onClick={() => {
                setEvents((prev) =>
                  prev.map((ev) => (ev.id === editingEvent.id ? editingEvent : ev))
                );
                setEditingEvent(null); // close editor
              }}
            >
              Save
            </button>
            <button onClick={() => setEditingEvent(null)}>Cancel</button>
          </div>
        )}

        {activeTab === "Staff Applications" && (
          <div>
            <h2>Pending Staff Applications</h2>
            {applications.length === 0 ? (
              <p>No new applications</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Staff Name</th>
                    <th style={thStyle}>Event</th>
                    <th style={thStyle}>Distance (km)</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const event = events.find(e => e.id === app.eventId);
                    const dist = getDistance(event.lat, event.lon, app.lat, app.lon).toFixed(1);
                    if (dist > 10) return null; // optional distance filter
                    return (
                      <tr key={app.id}>
                        <td style={tdStyle}>{app.staffName}</td>
                        <td style={tdStyle}>{event?.name}</td>
                        <td style={tdStyle}>{dist}</td>
                        <td style={tdStyle}>
                          <button
                            style={{ background: "#10b981", color: "#fff", border: "none", padding: "5px 8px", borderRadius: 4 }}
                            onClick={() => handleAccept(app.id)}
                          >Accept</button>
                          <button
                            style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 8px", borderRadius: 4, marginLeft: 8 }}
                            onClick={() => handleReject(app.id)}
                          >Reject</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}


        {/* Staff List */}
        {activeTab === "Staff List" && (
          <div style={{ padding: 10 }}>
            <h2>Staff Ratings</h2>

            {/* Rating Form */}
            <div style={{ marginBottom: 20, padding: 15, background: "#f3f4f6", borderRadius: 8 }}>
              <label>Staff Name</label>
              <input
                type="text"
                value={staffSearch || ""}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Start typing staff name..."
                list="staffList"
                style={{ width: "100%", marginBottom: 10, padding: 8 }}
              />
              <datalist id="staffList">
                {staff.map((s) => (
                  <div key={s.id}>
                    <p>{s.name}</p>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={s.rating || 0}
                      onChange={(e) => handleRating(s.id, Number(e.target.value))}
                    />
                  </div>
                ))}

              </datalist>

              <label>Rating</label>
              <div style={{ marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    onClick={() => setStaffRating(i)}
                    style={{
                      cursor: "pointer",
                      fontSize: 24,
                      color: i <= staffRating ? "#f59e0b" : "#d1d5db",
                      marginRight: 5
                    }}
                  >★</span>
                ))}
              </div>

              <label>Review</label>
              <textarea
                value={staffReview || ""}
                onChange={(e) => setStaffReview(e.target.value)}
                placeholder="Write review..."
                style={{ width: "100%", marginBottom: 10, padding: 8 }}
              />

              <label>Payment</label>
              <input
                type="number"
                value={staffPayment || 0}
                readOnly
                style={{ width: "100%", marginBottom: 10, padding: 8, background: "#e5e7eb" }}
              />

              <button
                onClick={() => {
                  if (!staffSearch) return alert("Select staff");
                  const sObj = staff.find(s => s.name === staffSearch);
                  if (!sObj) return alert("Staff not found");
                  const newEntry = {
                    name: staffSearch,
                    rating: staffRating,
                    review: staffReview,
                    payment: sObj.payment
                  };
                  setStaffRatings(prev => [...prev, newEntry]);
                  setStaffSearch("");
                  setStaffRating(0);
                  setStaffReview("");
                  setStaffPayment(0);
                }}
                style={{ background: "#10b981", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 5, cursor: "pointer" }}
              >
                Add Rating
              </button>
            </div>

            {/* Ratings Table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>Staff Name</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>Rating</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>Review</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>Payment</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #ccc" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffRatings && staffRatings.length > 0 ? staffRatings.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{r.name}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{r.rating} ⭐</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{r.review}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>${r.payment}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                      <button onClick={() => handleEditRating(i)} style={{ marginRight: 5, cursor: "pointer" }}>✏️</button>
                      <button onClick={() => handleDeleteRating(i)} style={{ cursor: "pointer" }}>🗑️</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} style={{ padding: 10, textAlign: "center" }}>No ratings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}


        {/* Profile */}
        {activeTab === "Profile" && (
          <div
            style={{
              width: "100%",
              margin: "0",
              padding: 20,
              background: "#f9fafb",
              borderRadius: 8,
              minHeight: "100vh"
            }}
          >
            <h2 style={{ marginBottom: 20 }}>👤 Organiser Profile</h2>

            {/* Full Name */}
            <label style={{ display: "block", marginBottom: 5 }}>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName || ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Email */}
            <label style={{ display: "block", marginBottom: 5 }}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Phone */}
            <label style={{ display: "block", marginBottom: 5 }}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Password */}
            <label style={{ display: "block", marginBottom: 5 }}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password || ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Organiser Name */}
            <label style={{ display: "block", marginBottom: 5 }}>Organisation Name</label>
            <input
              type="text"
              name="organiserName"
              value={form.organiserName || ""}
              onChange={(e) => setForm({ ...form, organiserName: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Business Type */}
            <label style={{ display: "block", marginBottom: 5 }}>Business Type</label>
            <input
              type="text"
              name="businessType"
              value={form.businessType || ""}
              onChange={(e) => setForm({ ...form, businessType: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Office Address */}
            <label style={{ display: "block", marginBottom: 5 }}>Office Address</label>
            <textarea
              name="officeAddress"
              value={form.officeAddress || ""}
              onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Website */}
            <label style={{ display: "block", marginBottom: 5 }}>Website</label>
            <input
              type="url"
              name="website"
              value={form.website || ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            {/* Company Logo */}
            <label style={{ display: "block", marginBottom: 5 }}>Company Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, companyLogo: e.target.files[0] })}
              style={{ marginBottom: 20 }}
            />
            {form.companyLogo && <p>Selected file: {form.companyLogo.name}</p>}

            {/* Buttons Container */}
            <div style={{ display: "flex", gap: 10 }}>
              {/* Save Button */}
              <button
                onClick={() => {
                  localStorage.setItem("organiserData", JSON.stringify(form));
                  alert("Profile saved successfully ✅");
                }}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Save Profile 💾
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  const savedData = JSON.parse(localStorage.getItem("organiserData"));
                  if (savedData) setForm(savedData); // Revert to last saved
                  else
                    setForm({
                      fullName: "",
                      email: "",
                      phone: "",
                      password: "",
                      organiserName: "",
                      businessType: "",
                      officeAddress: "",
                      website: "",
                      companyLogo: null,
                    }); // Clear if nothing saved
                }}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel ❌
              </button>
            </div>
          </div>
        )}


        {/* Full-page Event Creation Overlay */}
        {showCreatePage && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999
          }}>
            <div style={{
              width: "90%",
              maxWidth: 900,
              background: "#fff",
              borderRadius: 8,
              padding: 20,
              maxHeight: "90%",
              overflowY: "auto",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
            }}>
              <h2 style={{ marginBottom: 20 }}>📋 Create New Event</h2>

              <label>Event Name *</label>
            <input
              name="eventName"
              value={form.eventName}
              onChange={handleChange}
              placeholder="Enter event name"
              required
              style={{ width: "100%", marginBottom: 10, fontSize: 14 }}
            />
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ marginBottom: 5, display: "block" }}>Start Date & Time *</label>
              <input type="datetime-local" name="startDateTime" value={form.startDateTime} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }} />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ marginBottom: 5, display: "block" }}>End Date & Time *</label>
              <input type="datetime-local" name="endDateTime" value={form.endDateTime} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }} />
            </div>

              <label>Location *</label>
              <input placeholder="Search city" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "80%", marginBottom: 10, marginRight: 5 }} />
              <button type="button" onClick={handleSearchLocation} style={{ marginBottom: 10, padding: "5px 10px" }}>Search</button>
              <p style={{ fontSize: 14 }}>{form.location}</p>

              <MapContainer center={[form.lat, form.lon]} zoom={12} style={{ height: "300px", width: "100%", marginBottom: 10 }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                <Marker
                  position={[form.lat, form.lon]}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const pos = e.target.getLatLng();
                      setForm({ ...form, lat: pos.lat, lon: pos.lng });
                      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.display_name) setForm((f) => ({ ...f, location: data.display_name }));
                        });
                    },
                  }}
                />
                <LocationSelector form={form} setForm={setForm} />
                <MapUpdater lat={form.lat} lon={form.lon} />
              </MapContainer>

              <label>Staff Required *</label>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th>Role</th><th>Male</th><th>Female</th><th>Budget</th><th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => {
                  const isDJAnchor = role === "DJ" || role === "Anchor";
                  const staffData = form.staff[role] || {};
                  return (
                    <React.Fragment key={role}>
                      <tr>
                        <td><b>{role}</b></td>

                        {!isDJAnchor ? (
                          <>
                            <td><input type="number" min={0} value={staffData.male || ''} onChange={e => handleStaffChange(role, 'male', e.target.value)} style={{ width: 60 }} /></td>
                            <td><input type="number" min={0} value={staffData.female || ''} onChange={e => handleStaffChange(role, 'female', e.target.value)} style={{ width: 60 }} /></td>
                          </>
                        ) : (
                          <>
                            <td><input type="radio" name={`${role}-gender`} checked={staffData.male === 1} onChange={() => handleDJAnchorSelect(role, 'male')} /></td>
                            <td><input type="radio" name={`${role}-gender`} checked={staffData.female === 1} onChange={() => handleDJAnchorSelect(role, 'female')} /></td>
                          </>
                        )}

                        <td><input type="number" min={0} value={staffData.budget || ''} placeholder="₹/person" onChange={e => handleStaffChange(role, 'budget', e.target.value)} style={{ width: 90 }} /></td>
                        <td><textarea value={staffData.comments || ""} onChange={e => handleCommentChange(role, e.target.value)} style={{ width: "100%" }} /></td>
                      </tr>

                      {staffData.specialReq && staffData.specialReq.length > 0 && (
                        <tr>
                          <td colSpan={5} style={{ paddingLeft: 20 }}>
                            <b>Special Requirements:</b>{" "}
                            {staffData.specialReq.map(req => <span key={req} style={{ display: "inline-block", color: "#000", padding: "2px 6px", borderRadius: 4, marginRight: 5, marginBottom: 5 }}>{req}</span>)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {activeSpecialRole && form.staff[activeSpecialRole] && (form.staff[activeSpecialRole].male || form.staff[activeSpecialRole].female) > 0 && (
              <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                <div style={{ background: "#fff", padding: 20, borderRadius: 8, width: 400 }}>
                  <h3>Select Special Requirements for {activeSpecialRole}</h3>
                  <select multiple style={{ width: "100%", height: 150 }} value={form.staff[activeSpecialRole]?.specialReq || []} onChange={e => handleSpecialReqChange(activeSpecialRole, Array.from(e.target.selectedOptions).map(o => o.value))}>
                    {specialRequirements[activeSpecialRole].map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button onClick={closeSpecialPopup} style={{ padding: "5px 10px" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

         <div style={{ display: "flex", gap: "40px", marginBottom: 20 }}>
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <label>Total Staff (👥)</label>
    <input
      type="text"
      value={totalStaffCount}
      readOnly
      style={{
        width: "100%",
        height: 42,
        padding: "8px 12px",
        backgroundColor: "#f4f4f4",
        borderRadius: 6,
        border: "1px solid #ccc",
      }}
    />
  </div>

  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <label>Total Budget (₹)</label>
    <input
      type="text"
      value={totalBudget}
      readOnly
      style={{
        width: "100%",
        height: 42,
        padding: "8px 12px",
        backgroundColor: "#f4f4f4",
        borderRadius: 6,
        border: "1px solid #ccc",
      }}
    />
  </div>
</div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setShowCreatePage(false)}
                  style={{ background: "#ef4444", color: "#fff", border: "none", padding: "10px 15px", borderRadius: 5, cursor: "pointer" }}
                >
                  Cancel ❌
                </button>
                <button
                  onClick={handleSubmit}
                  style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 15px", borderRadius: 5, cursor: "pointer" }}
                >
                  Create Event ✅
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showProfilePreview && (
        <div
          onClick={() => setShowProfilePreview(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={form.companyLogo ? URL.createObjectURL(form.companyLogo) : "https://i.pravatar.cc/300"}
              alt="preview"
              style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
            />
          </div>
        </div>
      )}

      {/* Notifications modal */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "90%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", padding: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Notifications</h3>
              <button onClick={() => setShowDropdown(false)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Close</button>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: 10, textAlign: "center" }}>No notifications</div>
            ) : (
              <div>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                    <div style={{ fontSize: 14, marginBottom: 6 }}>{n.message}</div>
                    {n.type === "apply" && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => handleAccept(n.id)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Accept</button>
                        <button onClick={() => handleReject(n.id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
  );
}