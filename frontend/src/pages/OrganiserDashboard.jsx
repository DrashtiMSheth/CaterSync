import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5050");

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
  const thStyle = { padding: "10px", textAlign: "left", background: "#10b981", color: "#fff" };
  const tdStyle = { padding: "10px", textAlign: "left", verticalAlign: "top", borderBottom: "1px solid #ddd" };

  const initialForm = {
    eventName: "",
    eventType: "",
   startDateTime: "",  
  endDateTime: "", 
    location: "",
    lat: 19.07,
    lon: 72.87,
    priority: 1,
    staff: { Waiter: 0, Chef: 0, Cleaner: 0 },
    dressCode: "",
    roleNotes: "",
    notesForStaff: "",
    specialReqs: [],
    guestCount: 0,
    cateringStyle: "",
    budget: 0,
    advance: 0,
    balance: 0,
    paymentMode: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    attachments: []
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [events, setEvents] = useState([]);
  // const [staff] = useState(initialStaff);
  const [bubbles, setBubbles] = useState([]);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "apply", message: "Alice applied for Event A", staff: "Alice", event: "Event A" },
    { id: 2, type: "rating", message: "Bob rated your organisation ⭐ 4", staff: "Bob" },
    { id: 3, type: "warning", message: "Charlie tried to apply twice for Event B" },
  ]);
  const [showDropdown, setShowDropdown] = useState(false);
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
    await axios.put(`/api/events/${id}`, updatedEvent);
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
    { name: "Upcoming Events", icon: "⏳" },
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
  axios.get("/api/staff").then(res => setStaff(res.data));
  axios.get("/api/events").then(res => setEvents(res.data));

  // SOCKET EVENTS
  socket.on("staffApplied", (data) => {
    // Only add if not duplicate
    setApplications(prev => {
      if (prev.some(a => a.staffId === data.staffId && a.eventId === data.eventId)) return prev;
      return [...prev, data];
    });

    // Notification
    setNotifications(prev => [
      ...prev,
      { id: Date.now(), type: "apply", message: `${data.staffName} applied for ${data.eventName}` }
    ]);
  });

  socket.on("staffCancelled", (data) => {
    setApplications(prev => prev.filter(a => a.staffId !== data.staffId));
    setNotifications(prev => [
      ...prev,
      { id: Date.now(), type: "cancel", message: `${data.staffName} cancelled their application` }
    ]);
  });

  socket.on("eventUpdated", (data) => {
    setNotifications(prev => [
      ...prev,
      { id: Date.now(), type: "update", message: `${data.eventName} was updated (${data.changeType})` }
    ]);
  });

  socket.on("ratingReceived", (data) => {
    setNotifications(prev => [
      ...prev,
      { id: Date.now(), type: "rating", message: `${data.staffName} rated you ⭐ ${data.rating}` }
    ]);
  });

  return () => socket.disconnect();
}, []);


  useEffect(() => {
  const fetchEvents = async () => {
    try {
      const res = await axios.get("/api/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  };

  fetchEvents();
}, []);



  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };
  const handleStaffChange = (role, value) => { setForm(prev => ({ ...prev, staff: { ...prev.staff, [role]: parseInt(value)||0 } })); };
  const handleSpecialReqsChange = (e) => { const options = Array.from(e.target.selectedOptions, option => option.value); setForm(prev => ({ ...prev, specialReqs: options })); };
  const handleFileChange = (e) => { setForm(prev => ({ ...prev, attachments: Array.from(e.target.files) })); };

  
  const handleSubmit = () => {
    if (!form.eventName || !form.startDate) return alert("Event Name & Start Date required");
    setEvents(prev => [
  ...prev,
  { 
    id: prev.length + 1,
    name: form.eventName,
   startDateTime: new Date(`${form.startDate}T${form.startTime}`).toISOString(),
  endDateTime: new Date(`${form.endDate}T${form.endTime}`).toISOString(),
    location: form.location,
    lat: parseFloat(form.lat) || 0,
    lon: parseFloat(form.lon) || 0,
    priority: form.priority,
    staff: form.staff,
    specialReqs: form.specialReqs,
    budget: form.budget,
    paymentMode: form.paymentMode,
    attachments: form.attachments,
    applied: 0,
    required: Object.values(form.staff).reduce((a,b)=>a+b,0)
  }
]);

    
    setForm(initialForm);
    setShowCreatePage(false);
  };

  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      const data = await res.json();
      if (data.length>0) {
        setForm({...form, location:data[0].display_name, lat:parseFloat(data[0].lat), lon:parseFloat(data[0].lon)});
      } else alert("Location not found");
    } catch { alert("Error fetching location"); }
  };

  const handleAccept = (id) => { setNotifications(prev => prev.filter(n => n.id !== id)); alert("Application Accepted ✅"); };
  const handleReject = (id) => { setNotifications(prev => prev.filter(n => n.id !== id)); alert("Application Rejected ❌"); };

  const handleRating = async (staffId, rating) => {
  try {
    await axios.post(`/api/staff/${staffId}/rating`, { rating });
    setStaff(prev =>
      prev.map(s => (s.id === staffId ? { ...s, rating } : s))
    );
  } catch (err) {
    console.error("Failed to update rating", err);
  }
};

const handleProfileUpdate = async () => {
  try {
    await axios.put("/api/organiser/profile", form);
    alert("Profile updated!");
  } catch (err) {
    console.error("Failed to update profile", err);
  }
};


  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"Arial,sans-serif", position:"relative", overflow:"hidden" }}>

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
      <div style={{ width: sidebarOpen ? 220 : 60, background:"#1f2937", color:"#fff", transition:"width 0.3s", display:"flex", flexDirection:"column", zIndex:2 }}>
        <button style={{ margin:10, background:"#374151", color:"#fff", border:"none", padding:10, cursor:"pointer" }} onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
        {menuItems.map(item=>(<div key={item.name} onClick={()=>{setActiveTab(item.name); setShowCreatePage(false)}} style={{
          padding:15, cursor:"pointer",
          background: activeTab === item.name ? "#111827" : "transparent",
          display:"flex", alignItems:"center", gap: sidebarOpen ? 10 : 0, justifyContent: sidebarOpen ? "flex-start":"center", whiteSpace:"nowrap", overflow:"hidden",  transition: "background 0.3s" // optional: smooth effect
        }}><span>{item.icon}</span>{sidebarOpen && <span>{item.name}</span>}</div>))}
      </div>

      {/* Main */}
      <div style={{ flex:1, padding:20, background:"rgba(255,255,255,0.9)", overflowY:"scroll", zIndex:1, color:"#000" }}>
        {/* Top Bar */}
        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:20, padding:"10px 20px", borderBottom:"1px solid #e5e7eb", background:"#fff", marginBottom:15 }}>
          <div style={{ background:"#fef3c7", color:"#b45309", padding:"6px 12px", borderRadius:"20px", fontWeight:"bold", fontSize:"14px" }}>
           ⭐ {reviews.length > 0 
          ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
          : "0"} / 5          </div>
          <div style={{ position:"relative" }}>
            <span style={{ fontSize:22, cursor:"pointer" }} onClick={() => setShowDropdown(!showDropdown)}>🔔</span>
            {notifications.length > 0 && <span style={{position:"absolute", top:-5, right:-5, background:"red", color:"#fff", borderRadius:"50%", fontSize:"12px", padding:"2px 6px"}}>{notifications.length}</span>}
            {showDropdown && (
              <div style={{position:"absolute", right:0, top:30, width:300, background:"#fff", border:"1px solid #ddd", borderRadius:6, boxShadow:"0 2px 8px rgba(0,0,0,0.15)", zIndex:10}}>
                {notifications.length===0 ? <div style={{ padding:10, textAlign:"center" }}>No notifications</div> : notifications.map(n=>(
                  <div key={n.id} style={{ padding:"10px", borderBottom:"1px solid #eee" }}>
                    <div style={{ fontSize:14, marginBottom:5 }}>{n.message}</div>
                    {n.type==="apply" && (
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={()=>handleAccept(n.id)} style={{ background:"#10b981", color:"#fff", border:"none", padding:"4px 8px", borderRadius:4, cursor:"pointer" }}>Accept</button>
                        <button onClick={()=>handleReject(n.id)} style={{ background:"#ef4444", color:"#fff", border:"none", padding:"4px 8px", borderRadius:4, cursor:"pointer" }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
         <img
      src={form.companyLogo ? URL.createObjectURL(form.companyLogo) : "https://i.pravatar.cc/150"}
      alt="profile"
      style={{ borderRadius: "50%", width: 150, height: 150, cursor: "pointer" }}
      onClick={() => window.open(form.companyLogo ? URL.createObjectURL(form.companyLogo) : "https://i.pravatar.cc/300", "_blank")}
    />


          <button onClick={()=>{localStorage.removeItem("token"); window.location.href="/"}} style={{ background:"#374151", color:"#fff", border:"none", padding:"8px 12px", borderRadius:5, cursor:"pointer", fontWeight:"bold" }}>Logout</button>
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
            <button onClick={()=>setShowCreatePage(true)} style={{ padding:"10px 20px", background:"#10b981", color:"#fff", border:"none", borderRadius:5, cursor:"pointer", marginBottom:20 }}>+ Create New Event</button>
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
        {[1,2,3,4,5].map((i) => (
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
        style={{ width: "100%", marginBottom: 10, padding: 8, background:"#e5e7eb" }}
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
        style={{ background:"#10b981", color:"#fff", padding:"8px 12px", border:"none", borderRadius:5, cursor:"pointer" }}
      >
        Add Rating
      </button>
    </div>

    {/* Ratings Table */}
    <table style={{ width: "100%", borderCollapse:"collapse" }}>
      <thead>
        <tr>
          <th style={{ padding:10, borderBottom:"1px solid #ccc" }}>Staff Name</th>
          <th style={{ padding:10, borderBottom:"1px solid #ccc" }}>Rating</th>
          <th style={{ padding:10, borderBottom:"1px solid #ccc" }}>Review</th>
          <th style={{ padding:10, borderBottom:"1px solid #ccc" }}>Payment</th>
          <th style={{ padding:10, borderBottom:"1px solid #ccc" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {staffRatings && staffRatings.length > 0 ? staffRatings.map((r,i)=>(
          <tr key={i}>
            <td style={{ padding:10, borderBottom:"1px solid #eee" }}>{r.name}</td>
            <td style={{ padding:10, borderBottom:"1px solid #eee" }}>{r.rating} ⭐</td>
            <td style={{ padding:10, borderBottom:"1px solid #eee" }}>{r.review}</td>
            <td style={{ padding:10, borderBottom:"1px solid #eee" }}>${r.payment}</td>
            <td style={{ padding:10, borderBottom:"1px solid #eee" }}>
              <button onClick={() => handleEditRating(i)} style={{ marginRight:5, cursor:"pointer" }}>✏️</button>
              <button onClick={() => handleDeleteRating(i)} style={{ cursor:"pointer" }}>🗑️</button>
            </td>
          </tr>
        )) : (
          <tr><td colSpan={5} style={{ padding:10, textAlign:"center" }}>No ratings yet</td></tr>
        )}
      </tbody>
    </table>
  </div>
)}

{activeTab === "Ratings" && (
  <div className="relative w-full space-y-6 overflow-hidden">
    {/* ---- Rating Summary ---- */}
    <div className="bg-white p-6 rounded-lg shadow-md text-center z-10 relative">
      <h3 className="text-xl font-semibold mb-2">Organisation Rating Overview</h3>
      <p className="text-3xl font-bold text-yellow-500">
        ⭐ {reviews.length > 0 
          ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
          : "0"} / 5
      </p>
      <p className="text-gray-600">
        Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
      </p>
    </div>

    {/* ---- Review List ---- */}
    <div className="space-y-4 z-10 relative">
      {reviews.map((r, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-md">
          <strong>{r.staff}</strong> → {r.event} <br />
          ⭐ {r.rating} / 5 <br />
          <em>{r.review}</em>
        </div>
      ))}
    </div>


    {/* ---- Filters ---- */}
    <div className="flex flex-wrap gap-4 mb-4">
      <select
        className="p-2 border rounded w-full sm:w-auto"
        value={filterEvent}
        onChange={(e) => setFilterEvent(e.target.value)}
      >
        <option value="">All Events</option>
        {[...new Set(reviews.map((r) => r.event))].map((event) => (
          <option key={event} value={event}>{event}</option>
        ))}
      </select>

      <select
        className="p-2 border rounded w-full sm:w-auto"
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="highest">Highest Rating</option>
        <option value="lowest">Lowest Rating</option>
      </select>
    </div>

    {/* ---- Review Table ---- */}
    <div className="overflow-x-auto w-full rounded-lg shadow-lg border border-gray-300">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Staff</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Event</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Review</th>
            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {sortedReviews
            .filter((r) => (filterEvent ? r.event === filterEvent : true))
            .map((review, idx) => (
              <tr
                key={idx}
                className={`bg-white border-b border-gray-200 hover:bg-gray-50 transition duration-150`}
              >
                <td className="px-4 py-3 text-gray-800">{review.staff}</td>
                <td className="px-4 py-3 text-gray-800">{review.event}</td>
                <td className="px-4 py-3 text-yellow-500 font-semibold">
                  {"⭐".repeat(review.rating)}
                </td>
                <td className="px-4 py-3 text-gray-700">{review.review}</td>
                <td className="px-4 py-3 text-gray-500">{review.date}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}


        {/* Profile */}
       {activeTab === "Profile" && (
  <div
    style={{
      width: "100%" ,
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
              <input name="eventName" value={form.eventName} onChange={handleChange} placeholder="Enter event name" style={{ width:"100%", marginBottom:10 }} />

              <label>Event Type *</label>
              <select name="eventType" value={form.eventType} onChange={handleChange} style={{ width:"100%", marginBottom:10 }}>
                <option value="">--Select--</option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate</option>
                <option value="Birthday">Birthday</option>
                <option value="Concert">Concert</option>
              </select>

              <label>Start Date & Time *</label>
              <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={{ flex:1 }} />
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} style={{ flex:1 }} />
              </div>

              <label>End Date & Time *</label>
              <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={{ flex:1 }} />
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} style={{ flex:1 }} />
              </div>

              <label>Location *</label>
              <input placeholder="Search city" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} style={{ width:"80%", marginBottom:10, marginRight:5 }} />
              <button type="button" onClick={handleSearchLocation} style={{ marginBottom:10, padding:"5px 10px" }}>Search</button>
              <p style={{ fontSize:14 }}>{form.location}</p>

              <MapContainer center={[form.lat, form.lon]} zoom={12} style={{ height: "300px", width: "100%", marginBottom:10 }}>
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

              <label>Priority (1–5) *</label>
              <input type="number" min={1} max={5} name="priority" value={form.priority} onChange={handleChange} style={{ width:"100%", marginBottom:10 }} />

              <label>Staff Required</label>
              {Object.keys(form.staff).map(role=>(
                <div key={role} style={{ marginBottom:5 }}>
                  {role}: <input type="number" value={form.staff[role]} onChange={(e)=>handleStaffChange(role, e.target.value)} style={{ width:60 }} />
                </div>
              ))}

              <label>Special Requirements</label>
              <select multiple value={form.specialReqs} onChange={handleSpecialReqsChange} style={{ width:"100%", marginBottom:10 }}>
                <option value="Gluten-Free">Gluten-Free</option>
                <option value="Vegan">Vegan</option>
                <option value="Live Music">Live Music</option>
                <option value="Decoration">Decoration</option>
              </select>

              <label>Budget</label>
<input type="number" name="budget" value={form.budget} onChange={handleChange} style={{ width:"100%", marginBottom:10 }} />

<label>Payment Mode</label>
<select name="paymentMode" value={form.paymentMode} onChange={handleChange} style={{ width:"100%", marginBottom:10 }}>
  <option value="">--Select--</option>
  <option value="Cash">Cash</option>
  <option value="Bank Transfer">Bank Transfer</option>
  <option value="UPI">UPI</option>
</select>


              <label>Attachments</label>
              <input type="file" multiple onChange={handleFileChange} style={{ marginBottom:10 }} />

              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
                <button
                  onClick={() => setShowCreatePage(false)}
                  style={{ background:"#ef4444", color:"#fff", border:"none", padding:"10px 15px", borderRadius:5, cursor:"pointer" }}
                >
                  Cancel ❌
                </button>
                <button
                  onClick={handleSubmit}
                  style={{ background:"#10b981", color:"#fff", border:"none", padding:"10px 15px", borderRadius:5, cursor:"pointer" }}
                >
                  Create Event ✅
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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