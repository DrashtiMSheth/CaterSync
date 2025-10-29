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

// ---------- Star Rating Component ----------
function StarRatingUnique({ eventIdx, ratingMap, setRatingMap }) {
  const ratingValue = ratingMap[eventIdx] || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(starNum => (
        <span
          key={`star-${eventIdx}-${starNum}`}
          onClick={() => setRatingMap(prev => ({ ...prev, [eventIdx]: starNum }))}
          style={{ cursor: "pointer", color: starNum <= ratingValue ? "#f59e0b" : "#d1d5db", fontSize: 20 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ---------- Payment Modal Component ----------
function PaymentModalUnique({ open, event, onClose, onSubmit }) {
  if (!open || !event) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: 400, width: "90%", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <h3>Confirm Payment</h3>
        <div style={{ marginBottom: 10 }}>Amount: ${event.eventAmount}</div>
        <div style={{ marginBottom: 10 }}>
          <label>Payment Mode: </label><br />
          <select id="payment-mode-unique" style={{ width: "100%", padding: 8, marginTop: 5 }}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSubmit(document.getElementById("payment-mode-unique").value)} style={{ padding: "4px 8px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Confirm Pay</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Staff Detail Modal Component ----------
function StaffDetailModal({ staff, events, ratingMap, setRatingMap, onClose, onRate, onPay }) {
  if (!staff) return null;

  // Real-time overall rating calculation
  const ratedEvents = events.filter(e => e.ratedByOrg || ratingMap[events.indexOf(e)]);
  const overallRating = ratedEvents.length
    ? Math.round(
      ratedEvents.reduce((sum, e, idx) => sum + (e.ratedByOrg ? e.eventRate : ratingMap[idx] || 0), 0)
      / ratedEvents.length
    )
    : "Not Rated Yet";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: 800, width: "90%", maxHeight: "80%", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <h3>{staff.staffName} Details</h3>
        <div style={{ marginBottom: 15 }}>
          <strong>Overall Rating: </strong>{overallRating}{ratedEvents.length ? " ⭐" : ""}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Event Name</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Role</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Amount</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Rate</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Payment Mode</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Transaction ID</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Status</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((eventItem, idx) => (
              <tr key={`event-row-${staff.staffId}-${idx}`} style={{
                borderBottom: "1px solid #eee",
                backgroundColor: !eventItem.paidStatus ? "#fff7e6" : !eventItem.ratedByOrg ? "#e6f7ff" : "transparent"
              }}>
                <td style={{ padding: 10 }}>{eventItem.eventName}</td>
                <td style={{ padding: 10 }}>{eventItem.eventRole}</td>
                <td style={{ padding: 10 }}>${eventItem.eventAmount}</td>
                <td style={{ padding: 10 }}>{eventItem.ratedByOrg ? `${eventItem.eventRate} ⭐` : ratingMap[idx] ? `${ratingMap[idx]} ⭐` : "—"}</td>
                <td style={{ padding: 10 }}>{eventItem.paymentMethod || "—"}</td>
                <td style={{ padding: 10 }}>{eventItem.txnId || "—"}</td>
                <td style={{ padding: 10 }}>{eventItem.paidStatus ? <span style={{ color: "green", fontWeight: "bold" }}>Paid</span> : <span style={{ color: "orange" }}>Pending</span>}</td>
                <td style={{ padding: 10, display: "flex", gap: 5, alignItems: "center" }}>
                  {!eventItem.ratedByOrg && <>
                    <StarRatingUnique eventIdx={idx} ratingMap={ratingMap} setRatingMap={setRatingMap} />
                    <button onClick={() => onRate(idx)} style={{ padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginLeft: 5 }}>Rate</button>
                  </>}
                  {!eventItem.paidStatus && <button onClick={() => onPay(idx)} style={{ padding: "4px 8px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginLeft: 5 }}>Pay</button>}
                  {eventItem.paidStatus && <span style={{ color: "green", fontWeight: "bold" }}>✔</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={onClose} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", marginTop: 15 }}>Close</button>
      </div>
    </div>
  );
}

// ---------- Staff Directory Component ----------
function StaffDirectoryUnique({ staffList, onSelect }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Staff Name</th>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Email</th>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Contact</th>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>View</th>
        </tr>
      </thead>
      <tbody>
        {staffList.map(staff => (
          <tr key={`staff-row-${staff.staffId}`} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: 10 }}>{staff.staffName}</td>
            <td style={{ padding: 10 }}>{staff.staffEmail}</td>
            <td style={{ padding: 10 }}>{staff.staffContact}</td>
            <td style={{ padding: 10 }}>
              <button onClick={() => onSelect(staff.staffId)} style={{ padding: "6px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


export default function OrganiserDashboard({ bubbleCount = 25 }) {
  // const initialStaff = [
  //   { id: 1, name: "Alice", rating: 4, payment: 100, lat: 19.07, lon: 72.87, ratingsByOrganiser: {}, ratingsForOrganiser: [] },
  //   { id: 2, name: "Bob", rating: 3, payment: 80, lat: 19.05, lon: 72.88, ratingsByOrganiser: {}, ratingsForOrganiser: [] },
  //   { id: 3, name: "Charlie", rating: 5, payment: 120, lat: 19.1, lon: 72.85, ratingsByOrganiser: {}, ratingsForOrganiser: [] },
  // ];

  // const initialEvents = [
  //   { id: 1, name: "Event A", startDate: "2025-09-20", endDate: "2025-09-20", priority: "High", required: 10, applied: 10, lat: 19.06, lon: 72.86, staff: {}, specialReqs: [], attachments: [] },
  //   { id: 2, name: "Event B", startDate: "2025-09-22", endDate: "2025-09-22", priority: "Medium", required: 5, applied: 5, lat: 19.08, lon: 72.84, staff: {}, specialReqs: [], attachments: [] },
  // ];

  //   const todayStr = new Date().toISOString().split("T")[0];
  //   // Styling
  // const thStyle = {
  //   padding: "12px",
  //   border: "1px solid #ccc",
  //   backgroundColor: "#f3f4f6",
  //   fontWeight: "bold",
  //   textAlign: "left",
  // };

  // const tdStyle = {
  //   padding: "12px",
  //   border: "1px solid #ccc",
  //   verticalAlign: "top",
  // };

  // Styles
  const thStyle = { padding: "12px", border: "1px solid #ccc", background: "#f3f4f6", fontWeight: "bold", cursor: "pointer" };
  const tdStyle = { padding: "12px", border: "1px solid #ccc", verticalAlign: "top" };

  // Dummy past events data
  const pastEvents = [
    {
      id: 101,
      name: "Team Building Retreat",
      startDateTime: "2025-10-10T10:00",
      endDateTime: "2025-10-10T18:00",
      location: "Resort X",
      staff: {
        Waiter: { male: 2, female: 1, hoursWorked: 8, paymentPerHour: 10, paymentPerEvent: 0, paid: true },
        Chef: { male: 1, female: 1, hoursWorked: 8, paymentPerHour: 15, paymentPerEvent: 0, paid: true },
        DJ: { male: 1, female: 0, hoursWorked: 0, paymentPerHour: 0, paymentPerEvent: 100, paid: true },
      },
      extraExpenses: 40,
      extraPaid: true,
      status: "Completed",
    },
    {
      id: 102,
      name: "Product Launch",
      startDateTime: "2025-10-12T14:00",
      endDateTime: "2025-10-12T20:00",
      location: "Convention Center",
      staff: {
        Waiter: { male: 3, female: 2, hoursWorked: 6, paymentPerHour: 12, paymentPerEvent: 0, paid: true },
        Cleaner: { male: 1, female: 1, hoursWorked: 6, paymentPerHour: 8, paymentPerEvent: 0, paid: false },
        Anchor: { male: 1, female: 0, hoursWorked: 0, paymentPerHour: 0, paymentPerEvent: 120, paid: true },
      },
      extraExpenses: 70,
      extraPaid: false,
      status: "Completed",
    },
  ];

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

  // Styles for CurrentUpcomingEvents component
  const currentEventsThStyle = { padding: "12px", border: "1px solid #ccc", background: "#f3f4f6", fontWeight: "bold" };
  const currentEventsTdStyle = { padding: "12px", border: "1px solid #ccc", verticalAlign: "top" };
  const currentEventsButtonStyle = (disabled = false) => ({
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    background: disabled ? "#ccc" : "#3b82f6",
    color: disabled ? "#666" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  // Progress bar component
  const ProgressBar = ({ assigned, required }) => {
    const percentage = required ? Math.min((assigned / required) * 100, 100) : 0;
    let color = "#ef4444"; // red
    if (percentage === 100) color = "#16a34a"; // green
    else if (percentage > 0) color = "#facc15"; // yellow

    return (
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 12 }}>{assigned}/{required}</div>
        <div style={{ background: "#e5e7eb", borderRadius: 6, height: 12, width: "100%" }}>
          <div style={{ width: `${percentage}%`, background: color, height: "100%", borderRadius: 6 }} />
        </div>
      </div>
    );
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
    { id: 4, type: "apply", message: "abc applied for product launch", staff: "Alice", event: "Event A", status: "pending", createdAt: Date.now() - 1000 * 60 * 60 },
    { id: 5, type: "rating", message: "C rated your organisation ⭐ 3", staff: "Bob", status: "info", createdAt: Date.now() - 1000 * 60 * 30 },
 ]);
  const [showDropdown, setShowDropdown] = useState(false);
  // const [showProfilePreview, setShowProfilePreview] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  const [staffRatings, setStaffRatings] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRating, setStaffRating] = useState(0);
  const [staffReview, setStaffReview] = useState("");
  const [staffPayment, setStaffPayment] = useState(0);
  const handleDeleteRating = (index) => {
    setStaffRatings(prev => prev.filter((_, i) => i !== index));
  };
  //  const [editingEvent, setEditingEvent] = useState(null);
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

  const today = new Date().toISOString().split("T")[0];
  // const filteredEvents = events.filter((event) => {
  //   const start = new Date(event.startDate);
  //   const end = new Date(event.endDate || event.startDate);
  //   const now = new Date(today);

  //   if (activeTab === "Current Events") {
  //     return start <= now && end >= now;
  //   }
  //   if (activeTab === "Upcoming Events") {
  //     return start > now;
  //   }
  //   return true;
  // });


  // const organiserAvgRating = () => {
  //   const allRatings = staff.flatMap((s) => s.ratingsForOrganiser);
  //   if (allRatings.length === 0) return 0;
  //   return (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1);
  // };

  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Current Events", icon: "📅" },
    { name: "Event History", icon: "⏳" },
    { name: "Staff List", icon: "👥" },
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



  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEventss, setFilteredEventss] = useState(pastEvents); // ← assign dummy data
  const [sortConfig, setSortConfig] = useState({ key: "startDateTime", direction: "asc" });

  const formatDateTime = (dt) => dt?.replace("T", " ") || "-";

  const calculateStaffBudgett = (data) =>
    data.paymentPerEvent ? data.paymentPerEvent : (data.male + data.female) * (data.hoursWorked || 0) * (data.paymentPerHour || 0);

  const isAllPaid = (event) => {
    const staffPaid = Object.values(event.staff).every((s) => s.paid);
    return staffPaid && event.extraPaid;
  };

  // Sorting logic
  const sortedEvents = [...pastEvents].sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = a[key] || "";
    let valB = b[key] || "";
    if (key.includes("DateTime")) {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // Apply search filter
  const filteredEvents = sortedEvents.filter((event) => {
    const query = searchQuery.toLowerCase();
    const staffRoles = Object.keys(event.staff).join(" ").toLowerCase();
    return (
      event.name.toLowerCase().includes(query) ||
      staffRoles.includes(query) ||
      formatDateTime(event.startDateTime).toLowerCase().includes(query) ||
      formatDateTime(event.endDateTime).toLowerCase().includes(query)
    );
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const [now, setNow] = useState(new Date());
  const [editingEvents, setEditingEvents] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Local datetime for <input type="datetime-local">
  const toLocalDateTime = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date - tzOffset).toISOString().slice(0, 16);
  };

  const calculateStaffBudget = (data) =>
    data.paymentPerEvent
      ? data.paymentPerEvent
      : (data.male + data.female) * (data.hoursWorked || 0) * (data.paymentPerHour || 0);

  const isEditable = (event) => {
    const start = new Date(event.startDateTime);
    const cutoffDate = new Date(start);
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    return now < cutoffDate;
  };

  const eventss = [
    {
      id: 1,
      name: "Ongoing Event (Current)",
      startDateTime: toLocalDateTime(new Date(now.getTime() - 60 * 60 * 1000)),
      endDateTime: toLocalDateTime(new Date(now.getTime() + 2 * 60 * 60 * 1000)),
      location: "Main Hall",
      staff: { Waiter: { male: 1, female: 1, required: 2, hoursWorked: 4, paymentPerHour: 10, paymentPerEvent: 0 } },
      extraExpenses: 20,
    },
    {
      id: 2,
      name: "Event in 2 Hours (Upcoming)",
      startDateTime: toLocalDateTime(new Date(now.getTime() + 2 * 60 * 60 * 1000)),
      endDateTime: toLocalDateTime(new Date(now.getTime() + 5 * 60 * 60 * 1000)),
      location: "Hall B",
      staff: { DJ: { male: 1, female: 0, required: 1, hoursWorked: 0, paymentPerHour: 0, paymentPerEvent: 100 } },
      extraExpenses: 15,
    },
    {
      id: 3,
      name: "Event After 2 Days (Upcoming, non-editable)",
      startDateTime: toLocalDateTime(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
      endDateTime: toLocalDateTime(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)),
      location: "Garden Venue",
      staff: { Chef: { male: 2, female: 0, required: 2, hoursWorked: 5, paymentPerHour: 15, paymentPerEvent: 0 } },
      extraExpenses: 30,
    },
    {
      id: 4,
      name: "Event After 5 Days (Upcoming, editable)",
      startDateTime: toLocalDateTime(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
      endDateTime: toLocalDateTime(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)),
      location: "Banquet Hall",
      staff: { Photographer: { male: 1, female: 0, required: 1, hoursWorked: 0, paymentPerHour: 0, paymentPerEvent: 80 } },
      extraExpenses: 40,
    },
  ];

  const sortedEventss = [
    ...eventss.filter((e) => new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now),
    ...eventss.filter((e) => new Date(e.startDateTime) > now),
  ];

  const formatDateTimee = (dt) => dt?.replace("T", " ") || "-";
  const handleSave = () => {
    setEvents(prev =>
      prev.map(ev => ev.id === editingEvents.id ? editingEvents : ev)
    );
    setEditingEvents(null);
    alert("✅ Event updated successfully!");
  };

  const [staffRecords] = useState([
    { staffId: 1, staffName: "John Doe", staffEmail: "john@example.com", staffContact: "1234567890" },
    { staffId: 2, staffName: "Jane Smith", staffEmail: "jane@example.com", staffContact: "9876543210" },
    { staffId: 3, staffName: "Alice Johnson", staffEmail: "alice@example.com", staffContact: "9876543219" }
  ]);

  const [staffEventRecords, setStaffEventRecords] = useState({
    1: [
      { eventName: "Wedding Event", eventRole: "DJ", ratedByOrg: true, eventRate: 5, eventAmount: 150, paymentMethod: "Cash", txnId: "TXN123", paidStatus: true },
      { eventName: "Birthday Party", eventRole: "Photographer", ratedByOrg: false, paidStatus: false, eventAmount: 100 }
    ],
    2: [
      { eventName: "Corporate Event", eventRole: "Waiter", ratedByOrg: true, eventRate: 5, eventAmount: 200, paymentMethod: "UPI", txnId: "TXN456", paidStatus: true }
    ],
    3: [
      { eventName: "Conference", eventRole: "Cleaner", ratedByOrg: false, paidStatus: false, eventAmount: 50 }
    ]
  });

  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [starRatingMap, setStarRatingMap] = useState({});
  const [paymentModalState, setPaymentModalState] = useState({ open: false, eventIdx: null });

  const handleRate = (eventIdx) => {
    const rating = starRatingMap[eventIdx];
    if (!rating || rating < 1 || rating > 5) return alert("Select rating between 1–5 stars");

    setStaffEventRecords(prev => {
      const eventsCopy = [...prev[selectedStaffId]];
      eventsCopy[eventIdx] = { ...eventsCopy[eventIdx], ratedByOrg: true, eventRate: rating };
      return { ...prev, [selectedStaffId]: eventsCopy };
    });

    setStarRatingMap(prev => ({ ...prev, [eventIdx]: 0 }));
  };

  const handleOpenPayment = (eventIdx) => setPaymentModalState({ open: true, eventIdx });

  const handlePaymentSubmit = (mode) => {
    const txnId = `TXN-${selectedStaffId}-${paymentModalState.eventIdx}-${Date.now()}`;
    setStaffEventRecords(prev => {
      const eventsCopy = [...prev[selectedStaffId]];
      const event = eventsCopy[paymentModalState.eventIdx];
      eventsCopy[paymentModalState.eventIdx] = { ...event, paidStatus: true, paymentMethod: mode, txnId };
      return { ...prev, [selectedStaffId]: eventsCopy };
    });
    setPaymentModalState({ open: false, eventIdx: null });
  };

  const selectedStaff = staffRecords.find(s => s.staffId === selectedStaffId);
  const selectedEvents = selectedStaffId ? staffEventRecords[selectedStaffId] : [];

  const [showProfilePreview, setShowProfilePreview] = useState(false);

  const formm = {
    companyLogo: null, // Example: you can set an uploaded file here
  };

  const profileImage =
    form.companyLogo
      ? URL.createObjectURL(form.companyLogo)
      : "https://media.istockphoto.com/id/1191082076/photo/real-estate-designer-working-on-computer.jpg?s=612x612&w=0&k=20&c=JIwdczkVT71_C8Xrzo23fmpQ-3RQplSoNnZKEiyvYo4=";

    const [forme, setForme] = useState({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  organiserName: "",
  businessType: "",
  officeAddress: "",
  website: "",
  companyLogo: null,
});


  const [preview, setPreview] = useState(null);

  // ---------- Fetch organiser profile ----------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5050/api/organiser/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          setForme({
            companyLogo:
              data.organiser.companyLogo ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            fullName: data.organiser.fullName || "",
            email: data.organiser.email || "",
            phone: data.organiser.phone || "",
            organiserName: data.organiser.organiserName || "",
            businessType: data.organiser.businessType || "",
            officeAddress: data.organiser.officeAddress || "",
            website: data.organiser.website || "",
          });
        } else {
          console.error("Failed to load profile:", data.message);
        }
      } catch (err) {
        console.error("Error fetching organiser profile:", err);
      }
    };

    fetchProfile();
  }, []);

  // ---------- Handle input changes ----------
  const handleChangee = (e) => {
    const { name, value, files } = e.target;

    if (name === "companyLogo") {
      const file = files[0];
      setForme((prev) => ({ ...prev, companyLogo: file }));
      if (file) {
        setPreview(URL.createObjectURL(file));
      }
    } else {
      setForme((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ---------- Save organiser profile ----------
  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      Object.entries(setForme).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const res = await fetch("http://localhost:5050/api/organiser/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("Profile updated successfully!");
        setForme(data.organiser);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating organiser profile:", err);
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
       {/* ===== Dashboard Header ===== */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
    marginBottom: 10,
  }}
>
  {/* Left Side — Dashboard Title */}
  <h2
    style={{
      fontSize: "22px",
      fontWeight: "600",
      color: "#111827",
      margin: 0,
    }}
  >
    Dashboard
  </h2>

  {/* Right Side — Notifications + Profile + Logout */}
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    {/* Notification Icon */}
    <div style={{ position: "relative" }}>
      <span
        style={{ fontSize: 20, cursor: "pointer" }}
        onClick={() => setShowDropdown(true)}
      >
        🔔
      </span>
      {notifications.length > 0 && (
        <span
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            background: "red",
            color: "#fff",
            borderRadius: "50%",
            fontSize: "12px",
            padding: "2px 6px",
          }}
        >
          {notifications.length}
        </span>
      )}
    </div>

    {/* Profile Image */}
    <img
      src={profileImage}
      alt="profile"
      style={{
        borderRadius: "50%",
        width: 60,
        height: 60,
        objectFit: "cover",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        border: "2px solid #eee",
      }}
      onClick={() => setShowProfilePreview(true)}
    />

    {/* Fullscreen Image Preview */}
    {showProfilePreview && (
      <div
        onClick={() => setShowProfilePreview(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
          cursor: "pointer",
        }}
      >
        <img
          src={profileImage}
          alt="Profile Preview"
          style={{
            width: "60%",
            maxWidth: 400,
            borderRadius: 20,
            objectFit: "cover",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            transition: "transform 0.3s ease",
          }}
        />
      </div>
    )}

    {/* Logout Button */}
    <button
      onClick={() => {
        localStorage.removeItem("organiserToken");
        localStorage.removeItem("staffToken");
        localStorage.removeItem("token");
        window.location.href = "/";
      }}
      style={{
        background: "#374151",
        color: "#fff",
        border: "none",
        padding: "8px 12px",
        borderRadius: 5,
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Logout
    </button>
  </div>
</div>

        {/* Dashboard Cards */}
        {activeTab === "Dashboard" && (

          <>
            {/* <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: "15px",
      }}
    >
      {(() => {
        const today = new Date();

        // ✅ Fix counts:
        const currentEvents = events.filter(
          (e) =>
            new Date(e.startDate) <= today &&
            new Date(e.endDate || e.startDate) >= today
        ).length;

        const eventHistory = events.filter(
          (e) => new Date(e.endDate || e.startDate) < today
        ).length;

        const staffCount = staff.length;

        const cards = [
          { title: "Current Events", count: currentEvents },
          { title: "Event History", count: eventHistory },
          { title: "Staff List", count: staffCount },
        ];

        return cards.map((card) => (
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
              transition: "0.3s",
            }}
          >
            <div style={{ fontSize: 30, fontWeight: "bold" }}>
              {card.count}
            </div>
            <div style={{ fontSize: 16, marginTop: 10 }}>{card.title}</div>
          </div>
        ));
      })()}
    </div> */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: "15px" }}>
              {[
                { title: "Current Events", count: 4 },
                { title: "Event History", count: 2 },
                { title: "Staff List", count: 3 }
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

        {activeTab === "Current Events" && (
          <div style={{ padding: 20 }}>
            <h2>Current / Upcoming Events</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={currentEventsThStyle}>Name</th>
                    <th style={currentEventsThStyle}>Start</th>
                    <th style={currentEventsThStyle}>End</th>
                    <th style={currentEventsThStyle}>Location</th>
                    <th style={currentEventsThStyle}>Staff & Budget</th>
                    <th style={currentEventsThStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEventss.map((event) => {
                    const start = new Date(event.startDateTime);
                    const end = new Date(event.endDateTime);
                    const isCurrent = start <= now && end >= now;
                    const editable = !isCurrent && isEditable(event);

                    return (
                      <tr key={event.id} style={{ backgroundColor: isCurrent ? "#d1fae5" : "transparent" }}>
                        <td style={currentEventsTdStyle}>{event.name}</td>
                        <td style={currentEventsTdStyle}>{formatDateTimee(event.startDateTime)}</td>
                        <td style={currentEventsTdStyle}>{formatDateTimee(event.endDateTime)}</td>
                        <td style={currentEventsTdStyle}>{event.location}</td>
                        <td style={currentEventsTdStyle}>
                          {Object.entries(event.staff).map(([role, data]) => {
                            const assigned = data.male + data.female;
                            const required = data.required || assigned;
                            return (
                              <div key={role} style={{ marginBottom: 6 }}>
                                <div>{role}: {assigned} assigned ({calculateStaffBudgett(data)}$)</div>
                                <ProgressBar assigned={assigned} required={required} />
                              </div>
                            );
                          })}
                          {event.extraExpenses > 0 && <div>Extra: {event.extraExpenses}$</div>}
                        </td>
                        <td style={currentEventsTdStyle}>
                          {editable && (
                            <button style={currentEventsButtonStyle(false)} onClick={() => setEditingEvents(eventss)}>Edit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {editingEvents && (
              <div
                style={{
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
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: "25px 30px",
                    borderRadius: "10px",
                    width: "480px",
                    maxHeight: "90%",
                    overflowY: "auto",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  }}
                >
                  <h3 style={{ marginBottom: 20, textAlign: "center", fontSize: "20px" }}>
                    Edit Event
                  </h3>

                  {/* Event Fields */}
                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontWeight: 500 }}>Name:</label>
                    <input
                      type="text"
                      value={editingEvents.name || ""}
                      onChange={(e) =>
                        setEditingEvents({ ...editingEvents, name: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        marginTop: 5,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontWeight: 500 }}>Start:</label>
                    <input
                      type="datetime-local"
                      value={editingEvents.startDateTime || ""}
                      onChange={(e) =>
                        setEditingEvents({
                          ...editingEvents,
                          startDateTime: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        marginTop: 5,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontWeight: 500 }}>End:</label>
                    <input
                      type="datetime-local"
                      value={editingEvents.endDateTime || ""}
                      onChange={(e) =>
                        setEditingEvents({
                          ...editingEvents,
                          endDateTime: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        marginTop: 5,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <label style={{ fontWeight: 500 }}>Location:</label>
                    <input
                      type="text"
                      value={editingEvents.location || ""}
                      onChange={(e) =>
                        setEditingEvents({ ...editingEvents, location: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        marginTop: 5,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 25 }}>
                    <label style={{ fontWeight: 500 }}>Extra Expenses:</label>
                    <input
                      type="number"
                      value={editingEvents.extraExpenses || 0}
                      onChange={(e) =>
                        setEditingEvents({
                          ...editingEvents,
                          extraExpenses: parseInt(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        marginTop: 5,
                      }}
                    />
                  </div>

                  {/* Staff Section */}
                  {/* Staff Details */}
                  <h4
                    style={{
                      marginTop: 10,
                      marginBottom: 10,
                      fontSize: "18px",
                      borderBottom: "1px solid #ddd",
                      paddingBottom: 6,
                    }}
                  >
                    Staff Details
                  </h4>

                  {Object.entries(editingEvents?.staff || {}).map(([role, data]) => {
                    const assigned = (data.male || 0) + (data.female || 0);
                    const required = data.required || assigned;

                    return (
                      <div
                        key={role}
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          padding: "12px",
                          marginBottom: "15px",
                          background: "#f9f9f9",
                        }}
                      >
                        {/* Role */}
                        <strong
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontSize: "16px",
                            color: "#333",
                          }}
                        >
                          {role}
                        </strong>

                        {/* Male/Female inputs */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "14px" }}>Male:</label>
                            <input
                              type="number"
                              min="0"
                              value={data.male || 0}
                              onChange={(e) =>
                                setEditingEvents({
                                  ...editingEvents,
                                  staff: {
                                    ...editingEvents.staff,
                                    [role]: {
                                      ...data,
                                      male: parseInt(e.target.value) || 0,
                                    },
                                  },
                                })
                              }
                              style={{
                                width: "60px",
                                padding: "4px 6px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "13px",
                              }}
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "14px" }}>Female:</label>
                            <input
                              type="number"
                              min="0"
                              value={data.female || 0}
                              onChange={(e) =>
                                setEditingEvents({
                                  ...editingEvents,
                                  staff: {
                                    ...editingEvents.staff,
                                    [role]: {
                                      ...data,
                                      female: parseInt(e.target.value) || 0,
                                    },
                                  },
                                })
                              }
                              style={{
                                width: "60px",
                                padding: "4px 6px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "13px",
                              }}
                            />
                          </div>
                        </div>

                        {/* Assigned/Required count */}
                        <div
                          style={{
                            textAlign: "left",
                            fontSize: "13px",
                            color: "#555",
                            marginBottom: 6,
                          }}
                        >
                          {assigned}/{required}
                        </div>

                        {/* Progress bar */}
                        <div
                          style={{
                            height: "8px",
                            background: "#e0e0e0",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${(assigned / required) * 100}%`,
                              background: assigned >= required ? "#4caf50" : "#f57c00",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}


                  {/* Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: 10,
                    }}
                  >
                    <button
                      onClick={handleSave}
                      style={{
                        background: "#4caf50",
                        color: "#fff",
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingEvents(null)}
                      style={{
                        background: "#ccc",
                        color: "#000",
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Event History" && (
          <div>
            <input
              type="text"
              placeholder="Search by name, staff role, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "8px", width: "300px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={thStyle} onClick={() => handleSort("name")}>
                      Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle} onClick={() => handleSort("startDateTime")}>
                      Start {sortConfig.key === "startDateTime" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle} onClick={() => handleSort("endDateTime")}>
                      End {sortConfig.key === "endDateTime" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Staff & Budget</th>
                    <th style={thStyle}>Extra Expenses</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>All Payments Made</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventss.length > 0 ? (
                    filteredEventss.map((event) => (
                      <tr key={event.id}>
                        <td style={tdStyle}>{event.name}</td>
                        <td style={tdStyle}>{formatDateTime(event.startDateTime)}</td>
                        <td style={tdStyle}>{formatDateTime(event.endDateTime)}</td>
                        <td style={tdStyle}>{event.location}</td>
                        <td style={tdStyle}>
                          {Object.entries(event.staff).map(([role, data]) => (
                            <div key={role}>
                              {role}: {data.male + data.female} ({calculateStaffBudget(data)}$) {data.paid ? "✅" : "❌"}
                            </div>
                          ))}
                        </td>
                        <td style={tdStyle}>
                          {event.extraExpenses > 0 ? `${event.extraExpenses}$ ${event.extraPaid ? "✅" : "❌"}` : "-"}
                        </td>
                        <td style={tdStyle}>{event.status || "Completed"}</td>
                        <td style={tdStyle}>{isAllPaid(event) ? "✅ Paid" : "❌ Pending"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={tdStyle} colSpan={8}>No events found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        )}



        {/* Staff List */}
        {activeTab === "Staff List" && (
          <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
            <h2>Staff List</h2>
            <StaffDirectoryUnique staffList={staffRecords} onSelect={setSelectedStaffId} />

            <StaffDetailModal
              staff={selectedStaff}
              events={selectedEvents}
              ratingMap={starRatingMap}
              setRatingMap={setStarRatingMap}
              onClose={() => setSelectedStaffId(null)}
              onRate={handleRate}
              onPay={handleOpenPayment}
            />

            <PaymentModalUnique
              open={paymentModalState.open}
              event={selectedEvents[paymentModalState.eventIdx]}
              onClose={() => setPaymentModalState({ open: false, eventIdx: null })}
              onSubmit={handlePaymentSubmit}
            />
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
            zIndex: 999,
            borderRadius: 8
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

      {/* {showProfilePreview && (
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
      )} */}

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