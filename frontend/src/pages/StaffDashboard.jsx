import React, { useState, useEffect  } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
 const [profile, setProfile] = useState({
  fullName: "",
  email: "",
  phone: "",
  role: "",
  skills: [],
  experience: "",
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
      dragend: (e) => {},
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
useEffect(() => {
  // Example: fetch data from backend
  const fetchProfile = async () => {
    const res = await fetch("/api/staff/profile");
    const data = await res.json();

    setProfile(data);
    setOriginalProfile(data);
  };

  fetchProfile();
}, []);

const handleProfileSave = async () => {
  await fetch("/api/staff/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  setOriginalProfile(profile);
  alert("Profile updated successfully!");
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

  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      name: "Wedding Reception",
      startDate: "2025-09-21",
      startTime: "18:00",
      endDate: "2025-09-21",
      endTime: "23:00",
      location: "Banquet Hall A",
      priority: "High",
      staff: { Waiter: 5, Chef: 2 },
      budget: 5000,
      paymentMode: "UPI",
      attachments: ["menu.pdf", "layout.png"],
      status: "Open"
    },
    {
      name: "Corporate Dinner",
      startDate: "2025-09-25",
      startTime: "19:00",
      endDate: "2025-09-25",
      endTime: "22:00",
      location: "Conference Hall B",
      priority: "Medium",
      staff: { Waiter: 3, Chef: 1 },
      budget: 3000,
      paymentMode: "Cash",
      attachments: ["agenda.pdf"],
      status: "Assigned"
    }
  ]);

  const eventHistory = [
  {
    name: "Music Festival",
    startDate: "2025-09-01",
    startTime: "10:00",
    endDate: "2025-09-01",
    endTime: "18:00",
    location: "Open Ground",
    workedRoles: ["Serving", "Driving"],
    budget: 2000,
    paymentMode: "Cash",
    organiserReview: "Good work overall",
    status: "Completed",
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
  }
];



  const payments = [
    { event: "Corporate Gala", date: "2025-09-10", amount: 120, method: "UPI", status: "Paid" },
    { event: "Music Festival", date: "2025-09-05", amount: 150, method: "Cash", status: "Pending" },
  ];

  

  const staff = [
    { id: 1, name: "Alice", rating: 4, payment: 100 },
    { id: 2, name: "Bob", rating: 3, payment: 80 },
    { id: 3, name: "Charlie", rating: 5, payment: 120 },
  ];

  const notifications = [
    "Alice applied for Wedding Reception",
    "Bob applied for Corporate Dinner",
    "Charlie rated your work",
  ];

  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Upcoming Events", icon: "⏳" },
    { name: "Applied Events", icon: "📋" },
    { name: "Event History", icon: "🕒" },
    { name: "Payments", icon: "💰" },
    { name: "Ratings", icon: "⭐" },
    { name: "Profile", icon: "👤" },
  ];

  const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

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
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 220 : 60,
          background: "#1f2937",
          color: "#fff",
          transition: "width 0.3s",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          style={{ margin: 10, background: "#374151", color: "#fff", border: "none", padding: 10, cursor: "pointer" }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {menuItems.map((item) => (
          <div
            key={item.name}
            style={{
              padding: 15,
              cursor: "pointer",
              background: activeTab === item.name ? "#111827" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: sidebarOpen ? 10 : 0,
              justifyContent: sidebarOpen ? "flex-start" : "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onClick={() => setActiveTab(item.name)}
          >
            <span>{item.icon}</span>
            {sidebarOpen && <span>{item.name}</span>}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ background: "#fef3c7", color: "#b45309", padding: "6px 12px", borderRadius: 20, fontWeight: "bold", fontSize: 14 }}>
              ⭐ / 5
            </div>
            <div style={{ cursor: "pointer" }}>🔔 {notifications.length}</div>
           <div
  style={{ cursor: "pointer" }}
  onClick={() => setActiveTab("Profile")}
>
  {profile.profilePic ? (
    <img
      src={
        typeof profile.profilePic === "string"
          ? profile.profilePic
          : URL.createObjectURL(profile.profilePic)
      }
      alt="Profile"
      style={{
        width: 40,       // make it slightly bigger if needed
        height: 40,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#ccc",
      }}
    />
  )}
</div>

            <button
              style={{ padding: "6px 12px", background: "#374151", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
              onClick={() => alert("Logged out!")}
            >
              Logout
            </button>
          </div>
        </div>

      {activeTab === "Dashboard" && (
  <>
    {/* Dashboard Cards */}
    <div style={{ display: "flex", gap: "15px", marginBottom: 20, color: "#000" }}>
      {[
        { title: "Upcoming Events", count: upcomingEvents.length },
        { title: "Applied Events", count: appliedEventsList.length },
        { title: "Payments", count: totalEarnings },
      ].map((card) => (
        <div
          key={card.title}
          style={{
            flex: "1",
            minWidth: "150px",
            padding: "20px",
            background: "#fff",
            borderRadius: "8px",
            textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab(card.title)}
        >
          <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{card.title}</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold", color: "#111827" }}>
            {card.title === "Payments" ? `$${card.count}` : card.count}
          </p>
        </div>
      ))}
    </div>

    {/* Upcoming Events Table */}
    <h3>Upcoming Events</h3>
    <Table
      columns={["Event", "Start", "End", "Location", "Priority", "Staff", "Budget", "Payment Mode", "Attachments", "Status", "Action"]}
      data={upcomingEvents}
      renderRow={(event, i) => {
        const alreadyApplied = appliedEventsList.some(e => e.name === event.name);
        return (
          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
            <td style={tdStyle}>{event.name}</td>
            <td style={tdStyle}>{event.startDate} {event.startTime}</td>
            <td style={tdStyle}>{event.endDate} {event.endTime}</td>
            <td style={tdStyle}>{event.location}</td>
            <td style={tdStyle}>{event.priority}</td>
            <td style={tdStyle}>
              {Object.entries(event.staff).map(([role, count]) => <div key={role}>{role}: {count}</div>)}
            </td>
            <td style={tdStyle}>${event.budget}</td>
            <td style={tdStyle}>{event.paymentMode}</td>
            <td style={tdStyle}>{event.attachments.join(", ")}</td>
            <td style={tdStyle}>{event.status}</td>
            <td style={tdStyle}>
              {event.status === "Open" && (
                <button
                  disabled={alreadyApplied}
                  style={{
                    padding: "5px 10px",
                    background: alreadyApplied ? "gray" : "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: alreadyApplied ? "not-allowed" : "pointer",
                  }}
                  onClick={() => handleApply(event.name)}
                >
                  {alreadyApplied ? "Applied" : "Apply"}
                </button>
              )}
            </td>
          </tr>
        );
      }}
    />

    {/* Applied Events Table */}
    <h3>Applied Events</h3>
    <Table
      columns={["Event Name", "Start", "End", "Location", "Priority", "Staff", "Budget", "Payment Mode", "Attachments", "Status"]}
      data={appliedEventsList.map(applied => {
        const event = upcomingEvents.find(e => e.name === applied.name);
        return {
          ...applied,
          startDate: event?.startDate || "",
          startTime: event?.startTime || "",
          endDate: event?.endDate || "",
          endTime: event?.endTime || "",
          location: event?.location || "",
          priority: event?.priority || "",
          staff: event?.staff || {},
          budget: event?.budget || "",
          paymentMode: event?.paymentMode || "",
          attachments: event?.attachments || [],
        };
      })}
      renderRow={(applied, i) => (
        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
          <td style={tdStyle}>{applied.name}</td>
          <td style={tdStyle}>{applied.startDate} {applied.startTime}</td>
          <td style={tdStyle}>{applied.endDate} {applied.endTime}</td>
          <td style={tdStyle}>{applied.location}</td>
          <td style={tdStyle}>{applied.priority}</td>
          <td style={tdStyle}>
            {Object.entries(applied.staff).map(([role, count]) => <div key={role}>{role}: {count}</div>)}
          </td>
          <td style={tdStyle}>${applied.budget}</td>
          <td style={tdStyle}>{applied.paymentMode}</td>
          <td style={tdStyle}>{applied.attachments.join(", ")}</td>
          <td style={tdStyle}>{applied.status}</td>
        </tr>
      )}
    />
  </>
)}


        {/* Tabs */}
        {activeTab === "Upcoming Events" && (
          <div>
            <h3>Upcoming Events</h3>
            <Table
              columns={["Event", "Start Date", "Start Time", "End Date", "End Time", "Location", "Priority", "Staff", "Budget", "Payment Mode", "Attachments", "Status", "Action"]}
              data={upcomingEvents}
              renderRow={(event, i) => {
                const alreadyApplied = appliedEventsList.some(e => e.name === event.name);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" ,color: "#000"}}>
                    <td style={tdStyle}>{event.name}</td>
                    <td style={tdStyle}>{event.startDate}</td>
                    <td style={tdStyle}>{event.startTime}</td>
                    <td style={tdStyle}>{event.endDate}</td>
                    <td style={tdStyle}>{event.endTime}</td>
                    <td style={tdStyle}>{event.location}</td>
                    <td style={tdStyle}>{event.priority}</td>
                    <td style={tdStyle}>
                      {Object.entries(event.staff).map(([role, count]) => <div key={role}>{role}: {count}</div>)}
                    </td>
                    <td style={tdStyle}>${event.budget}</td>
                    <td style={tdStyle}>{event.paymentMode}</td>
                    <td style={tdStyle}>
                      {event.attachments.map((file, idx) => <div key={idx}>{file}</div>)}
                    </td>
                    <td style={tdStyle}>{event.status}</td>
                    <td style={tdStyle}>
                      {event.status === "Open" && (
                        <button
                          disabled={alreadyApplied}
                          style={{
                            padding: "5px 10px",
                            background: alreadyApplied ? "gray" : "#3b82f6",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: alreadyApplied ? "not-allowed" : "pointer",
                          }}
                          onClick={() => handleApply(event.name)}
                        >
                          {alreadyApplied ? "Applied" : "Apply"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }}
            />
          </div>
        )}

{activeTab === "Applied Events" && (
  <>
    <h3>Applied Events</h3>
    <Table
      columns={["Event Name", "Start", "End", "Location", "Priority", "Staff", "Budget", "Payment Mode", "Attachments", "Status"]}
      data={appliedEventsList.map(applied => {
        // Find the corresponding event details
        const event = upcomingEvents.find(e => e.name === applied.name);

        return {
          ...applied,
          startDate: event?.startDate || "",
          startTime: event?.startTime || "",
          endDate: event?.endDate || "",
          endTime: event?.endTime || "",
          location: event?.location || "",
          priority: event?.priority || "",
          staff: event?.staff || {},
          budget: event?.budget || "",
          paymentMode: event?.paymentMode || "",
          attachments: event?.attachments || [],
          status: applied.status || "Pending",
        };
      })}
      renderRow={(applied, i) => (
        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
          <td style={tdStyle}>{applied.name}</td>
          <td style={tdStyle}>{applied.startDate} {applied.startTime}</td>
          <td style={tdStyle}>{applied.endDate} {applied.endTime}</td>
          <td style={tdStyle}>{applied.location}</td>
          <td style={tdStyle}>{applied.priority}</td>
          <td style={tdStyle}>
            {Object.entries(applied.staff).length
              ? Object.entries(applied.staff).map(([role, count]) => <div key={role}>{role}: {count}</div>)
              : "-"}
          </td>
          <td style={tdStyle}>${applied.budget}</td>
          <td style={tdStyle}>{applied.paymentMode}</td>
          <td style={tdStyle}>{applied.attachments.length ? applied.attachments.join(", ") : "-"}</td>
          <td style={tdStyle}>{applied.status}</td>
        </tr>
      )}
    />
  </>
)}


  {activeTab === "Event History" && (
  <>
    <h3>Event History</h3>
    <Table
      columns={["Event Name", "Start", "End", "Location", "Worked Roles", "Budget", "Payment Mode", "Organiser Review", "Status"]}
      data={eventHistory}
      renderRow={(event, i) => (
        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
          <td style={tdStyle}>{event.name}</td>
          <td style={tdStyle}>{event.startDate} {event.startTime}</td>
          <td style={tdStyle}>{event.endDate} {event.endTime}</td>
          <td style={tdStyle}>{event.location}</td>
          <td style={tdStyle}>{event.workedRoles.join(", ")}</td>
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
    <h3>Total Earnings: ${totalEarnings}</h3>
    <Table
      columns={["Event Name", "Start", "Location", "Worked Roles", "Budget", "Payment Mode", "Status", "Action"]}
      data={payments.map(payment => {
        const event = upcomingEvents.find(e => e.name === payment.event) || {};
        return {
          ...payment,
          startDate: event.startDate || "",
          startTime: event.startTime || "",
          location: event.location || "",
          workedRoles: event.workedRoles || [], // Example: ["Serving", "Driving"]
          budget: event.budget || "",
          paymentMode: event.paymentMode || "",
        };
      })}
      renderRow={(payment, i) => {
        const isPending = payment.status.toLowerCase() === "pending";
        return (
          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
            <td style={tdStyle}>{payment.event}</td>
            <td style={tdStyle}>{payment.startDate} {payment.startTime}</td>
            <td style={tdStyle}>{payment.location}</td>
            <td style={tdStyle}>{(payment.workedRoles || []).join(", ")}</td>
            <td style={tdStyle}>${payment.budget}</td>
            <td style={tdStyle}>{payment.paymentMode}</td>
            <td style={tdStyle}>{payment.status}</td>
            <td style={tdStyle}>
              {isPending ? (
                <button
                  style={{
                    padding: "5px 10px",
                    background: "#f59e0b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  onClick={() => alert(`Payment request sent to organiser for ${payment.event}`)}
                >
                  Request Payment
                </button>
              ) : (
                "—"
              )}
            </td>
          </tr>
        );
      }}
    />
  </div>
)}

{activeTab === "Ratings" && (
  <div style={{ background: "#fff", padding: 20, borderRadius: 5, color: "#000" }}>
    <h3>Staff Rating | Staff Review</h3>

    {/* Event Selection */}
    <label>Select Event:</label>
    <select
      value={selectedEvent?.name || ""}
      onChange={(e) => {
        const event = upcomingEvents.find(ev => ev.name === e.target.value);
        if (event) {
          setSelectedEvent({
            ...event,
            organiser: event.organiser || "Organizer", // auto-set organiser
          });
          setRating(0); // reset star
          setReview(""); // reset review
        }
      }}
      style={{ width: "100%", margin: "8px 0", padding: 6 }}
    >
      <option value="">-- Select Event --</option>
      {upcomingEvents.map(ev => (
        <option key={ev.name} value={ev.name}>
          {ev.name}
        </option>
      ))}
    </select>

    {/* Display Organiser */}
    {selectedEvent && (
      <div style={{ marginBottom: 10 }}>
        <strong>Organiser:</strong> {selectedEvent.organiser}
      </div>
    )}

    {/* Rating Form */}
    {selectedEvent && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!selectedEvent) return;

          const newEntry = {
            eventName: selectedEvent.name,
            organiser: selectedEvent.organiser,
            rating,
            review,
          };
          setRatingsList(prev => [...prev, newEntry]);
          setRating(0);
          setReview("");
          alert("Rating submitted!");
        }}
      >
        {/* Star Rating */}
        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(rating === star ? 0 : star)} // toggle star
              style={{ cursor: "pointer", fontSize: 24, color: rating >= star ? "gold" : "gray" }}
            >
              ★
            </span>
          ))}
        </div>

        {/* Review */}
        <textarea
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc", marginBottom: 8 }}
          rows={3}
          placeholder="Write your review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <button type="submit" style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", borderRadius: 4 }}>
          Submit Review
        </button>
      </form>
    )}

    {/* Ratings Table */}
    {ratingsList.length > 0 && (
      <div style={{ marginTop: 20 }}>
        <h4>Previous Ratings</h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#111827", color: "#fff" }}>
              {["Event Name", "Organiser", "Rating", "Review"].map((col, i) => (
                <th key={i} style={{ padding: 10, textAlign: "center" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ratingsList.map((entry, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
                <td style={{ padding: 10, textAlign: "center" }}>{entry.eventName}</td>
                <td style={{ padding: 10, textAlign: "center" }}>{entry.organiser}</td>
                <td style={{ padding: 10, textAlign: "center" }}>{entry.rating} ⭐</td>
                <td style={{ padding: 10, textAlign: "center" }}>{entry.review}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{activeTab === "Profile" && (
  <div style={{ background: "#fff", padding: 20, borderRadius: 5, color: "#000" }}>
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
          typeof profile.profilePic === "string"
            ? profile.profilePic
            : URL.createObjectURL(profile.profilePic)
        }
        alt="Profile"
        style={{ width: 100, height: 100, borderRadius: "50%", marginBottom: 10 }}
      />
    )}

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

    {/* Role */}
    <label>Role:</label>
    <input
      type="text"
      value={profile.role}
      disabled
      style={{ width: "100%", marginBottom: 10, padding: 6, background: "#f0f0f0" }}
    />

    {/* Skills */}
    <label>Skills (comma separated):</label>
    <input
      type="text"
      value={profile.skills.join(", ")}
      onChange={(e) =>
        setProfile({ ...profile, skills: e.target.value.split(",") })
      }
      style={{ width: "100%", marginBottom: 10, padding: 6 }}
    />

    {/* Experience */}
    <label>Experience:</label>
    <input
      type="text"
      value={profile.experience}
      onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
      style={{ width: "100%", marginBottom: 10, padding: 6 }}
    />

  {/* City Search */}
<label>City:</label>
<div style={{ display: "flex", marginBottom: 10 }}>
  <input
    type="text"
    value={profile.city}
    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
    style={{ flex: 1, padding: 6 }}
  />
  <button
    onClick={async () => {
      if (!profile.city) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${profile.city}`
        );
        const data = await res.json();

        if (data && data.length > 0) {
          const loc = data[0];
          const newPos = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) };

          // Update marker and profile state
          setMarkerPosition(newPos);
          setProfile((prev) => ({ ...prev, lat: newPos.lat, lng: newPos.lng }));

          // Move map smoothly
          if (mapInstance) {
            mapInstance.flyTo([newPos.lat, newPos.lng], 13, { duration: 1.5 });
          }
        } else {
          alert("City not found");
        }
      } catch (err) {
        console.error("City search error:", err);
      }
    }}
  >
    Search
  </button>
</div>

{/* Map */}
<label>Set Location on Map:</label>
<div style={{ height: 300, marginBottom: 10 }}>
  <MapContainer
    center={[markerPosition.lat, markerPosition.lng]}
    zoom={13}
    style={{ height: "100%", width: "100%" }}
    whenCreated={(map) => setMapInstance(map)}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
    <Marker
      draggable
      position={markerPosition}
      eventHandlers={{
        dragend: (e) => {
          const pos = e.target.getLatLng();
          setMarkerPosition({ lat: pos.lat, lng: pos.lng });
          setProfile((prev) => ({ ...prev, lat: pos.lat, lng: pos.lng }));
        },
      }}
    />
  </MapContainer>
</div>

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



      </div>
    </div>
  );
}
