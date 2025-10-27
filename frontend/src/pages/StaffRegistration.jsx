// src/pages/StaffRegistration.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { registerStaff, sendOtp} from "../api/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";

// --- Leaflet Default Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// --- OTP generator ---
// const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Map Marker Component ---
function LocationMarker({ setForm, coords, setCoords }) {
  const [position, setPosition] = useState(coords);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setCoords([lat, lng]);
      setForm(prev => ({
        ...prev,
        lat,
        lng,
        address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
      }));
    }
  });

  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: e => {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
          setCoords([lat, lng]);
          setForm(prev => ({
            ...prev,
            lat,
            lng,
            address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
          }));
        }
      }}
    />
  ) : null;
}

// --- Map view updater ---
function ChangeMapView({ coords }) {
  const map = useMap();
  if (coords) map.setView(coords, 13);
  return null;
}

// --- Main Component ---
export default function StaffRegistration({ go, loading, setLoading }) {
  const { login } = useAuth(); // AuthContext login
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "",
    role: "", skills: [], city: "", address: "", lat: null, lng: null,
    availability: "", gender: "", languages: [], profilePic: null,
    otp: "", terms: false,
    startDate: "", startTime: ""
  });
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  // const [generatedOtp, setGeneratedOtp] = useState("");
  // const [otpExpiry, setOtpExpiry] = useState(null);
  // const [otpCountdown, setOtpCountdown] = useState(0);
   const [otpCountdown, setOtpCountdown] = useState(0);
    const [otpToken, setOtpToken] = useState("");
    const [serverOtp, setServerOtp] = useState(""); // Dev helper: show OTP returned by backend
  const [showOtp, setShowOtp] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ label: "", color: "" });
  const [coords, setCoords] = useState([20.5937, 78.9629]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const formRef = useRef(null);

  // --- Socket.IO setup ---
  // Use shared socket instance from utils/socket.js

  useEffect(() => {
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("staff-registered", (data) => {
      alert(`📢 New staff registered: ${data.name}`);
    });
    return () => socket.disconnect();
  }, [socket]);

  // --- Password strength ---
  useEffect(() => {
    const pw = form.password;
    if (!pw) setPasswordStrength({ label: "", color: "" });
    else if (pw.length < 8) setPasswordStrength({ label: "Weak", color: "red" });
    else if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[@$!%*?&]/.test(pw))
      setPasswordStrength({ label: "Strong", color: "green" });
    else setPasswordStrength({ label: "Medium", color: "orange" });
  }, [form.password]);

  // // --- OTP Countdown ---
  // useEffect(() => {
  //   if (!otpExpiry) return;
  //   const timer = setInterval(() => {
  //     const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
  //     setOtpCountdown(remaining);
  //     if (remaining === 0) clearInterval(timer);
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, [otpExpiry]);

   // OTP countdown
    useEffect(() => {
      if (otpCountdown > 0) {
        const timer = setInterval(() => setOtpCountdown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(timer);
      }
    }, [otpCountdown]);
  

  // --- Scroll to form on step change ---
  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  // --- Form input handler ---
  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));

    if (type === "file") {
      const file = files[0];
      if (file && file.size > 5 * 1024 * 1024) return;
      setForm(s => ({ ...s, [name]: file || null }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else if (type === "checkbox") setForm(s => ({ ...s, [name]: checked }));
    else if (type === "select-multiple") {
      const options = Array.from(e.target.selectedOptions, opt => opt.value);
      setForm(s => ({ ...s, [name]: options }));
    } else setForm(s => ({ ...s, [name]: value }));
  };

  // --- Step validation ---
  const validateStep1 = () => {
    const newErrors = {};
    if (!form.fullName) newErrors.fullName = "Enter full name";
    if (!form.email) newErrors.email = "Enter email";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.phone) newErrors.phone = "Enter phone";
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = "Phone must be 10 digits";
    if (!form.password) newErrors.password = "Enter password";
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.skills.length) newErrors.skills = "Select at least one skill";
    if (!form.city) newErrors.city = "Enter city";
    if (!form.availability) newErrors.availability = "Enter availability";
    if (!form.gender) newErrors.gender = "Select gender";
    if (!form.languages.length) newErrors.languages = "Select at least one language";
    if (!form.profilePic) newErrors.profilePic = "Upload profile picture";
    return newErrors;
  };

   // Move to next step
    const handleNext = async () => {
    const newErrors = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(newErrors).length > 0) {
      alert(Object.values(newErrors).join("\n")); // Show all errors in alert
      return setErrors(newErrors);
    }
      if (step === 2) {
        try {
          // Backend expects phone at /api/otp/send-otp
          const res = await sendOtp({ phone: form.phone });
          // If backend returns just message/otp, we proceed without token
          setOtpToken(res?.otpToken || "");
          if (res?.otp) setServerOtp(String(res.otp));
          setOtpCountdown(120);
        } catch (err) {
          console.error("OTP error:", err);
          const msg = err.response?.data?.message || "Failed to send OTP";
    alert(msg);
        }
      }
  
      setCompletedSteps(prev => [...new Set([...prev, step])]);
      setStep(prev => prev + 1);
    };

   // Handle OTP verification // Handle OTP resend
    const handleResendOtp = async () => {
      try {
        // Send new OTP request
        const res = await sendOtp({ phone: form.phone });
        // Update with new OTP
        if (res?.otp) setServerOtp(String(res.otp));
        // Reset countdown
        setOtpCountdown(120);
        // Clear current OTP input
        setForm(prev => ({ ...prev, otp: "" }));
        alert("New OTP sent successfully!");
      } catch (err) {
        console.error("OTP resend error:", err);
        alert("Failed to resend OTP");
      }
    };

  // --- City search ---
  const handleCitySearch = async () => {
    if (!form.city) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${form.city}`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setCoords([parseFloat(lat), parseFloat(lon)]);
        setForm(prev => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lon), address: display_name }));
      } else alert("City not found");
    } catch (err) { console.error(err); }
  };

  // --- Submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
     if (!form.otp) newErrors.otp = "Enter OTP";
    if (!form.terms) newErrors.terms = "Accept Terms & Conditions";
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setLoading(true);
    try {
      const fd = new FormData();
      for (const k in form) {
        if (["skills", "languages"].includes(k)) form[k].forEach(v => fd.append(k, v));
        else if (k === "profilePic" && form.profilePic) fd.append("profilePic", form.profilePic);
        else fd.append(k, form[k]);
      }
      if (otpToken) fd.append("otpToken", otpToken);

      const data = await registerStaff(fd);
      if (!data.success) alert(data.message || "⚠️ Registration failed");
      else {
        alert("🎉 Registration successful! Please log in.");
        login(data.token, data.staff); // ✅ auto login
        socket.emit("staff-registered", { id: data.staff._id, name: data.staff.fullName });
        go("staff-login");
      }

    } catch (err) { console.error(err); alert(err.message || "⚠️ Server connection failed"); }
    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "12px", margin: "8px 0 16px", borderRadius: "8px", border: "1px solid #ccc" };
  const getPasswordBarColor = () => passwordStrength.color || "transparent";

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }} ref={formRef}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)", backgroundSize: "600% 600%", animation: "gradientShift 15s ease infinite" }}>
        <div style={{ width: "100%", maxWidth: "600px", background: "rgba(0,0,0,0.6)", boxShadow: "0 8px 16px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", padding: "30px", borderRadius: "16px", color: "#fff" }}>
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>Staff Registration</h2>

          {/* Step Progress */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            {["Step 1","Step 2","Step 3"].map((s,i)=>(
              <div key={i} style={{ flex:1, textAlign:"center", padding:"10px", borderBottom: step >= i+1 ? "4px solid #00ffcc":"4px solid #555", color: step >= i+1?"#fff":"#bbb", fontWeight: step===i+1?"bold":"normal" }}>{s} {completedSteps.includes(i+1) && <span style={{color:"#00ffcc"}}>✓</span>}</div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* --- Steps --- */}
            {step===1 && <>
              <label>Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} placeholder="Full Name"/>
              {errors.fullName && <p style={{color:"red", fontSize:12}}>{errors.fullName}</p>}

              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} placeholder="Email"/>
              {errors.email && <p style={{color:"red", fontSize:12}}>{errors.email}</p>}

              <label>Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="Phone"/>
              {errors.phone && <p style={{color:"red", fontSize:12}}>{errors.phone}</p>}

              <label>Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} style={inputStyle} placeholder="Password"/>
              {errors.password && <p style={{color:"red", fontSize:12}}>{errors.password}</p>}

              {form.password && <div style={{ height:8, width:"100%", borderRadius:4, background:"#555", marginTop:4 }}>
                <div style={{ width: passwordStrength.label==="Weak"? "33%" : passwordStrength.label==="Medium"?"66%":"100%", height:"100%", borderRadius:4, background:getPasswordBarColor(), transition:"width 0.3s ease"}}></div>
              </div>}
            </>}

            {step===2 && <>
            <label>Skills *</label>
              <select name="skills" multiple value={form.skills} onChange={handleChange} style={inputStyle}>
                <option value="Service">Service</option>
                <option value="Cooking">Cooking</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Bartending">Bartending</option>
              </select>
              {errors.skills && <p style={{color:"red", fontSize:12}}>{errors.skills}</p>}

              <label>City *</label>
              <input name="city" value={form.city} onChange={handleChange} style={inputStyle} placeholder="City"/>
              <button type="button" onClick={handleCitySearch} style={{ marginBottom: 8, padding:"6px 12px", borderRadius:6 }}>Search City</button>
              {errors.city && <p style={{color:"red", fontSize:12}}>{errors.city}</p>}

              <label>Map Location</label>
              <MapContainer center={coords} zoom={13} style={{ height: 200, borderRadius: 8, marginBottom: 12 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <LocationMarker setForm={setForm} coords={coords} setCoords={setCoords}/>
                <ChangeMapView coords={coords}/>
              </MapContainer>

              <label>Availability *</label>
              <input name="availability" value={form.availability} onChange={handleChange} style={inputStyle} placeholder="Availability"/>
              {errors.availability && <p style={{color:"red", fontSize:12}}>{errors.availability}</p>}

              <label>Gender *</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p style={{color:"red", fontSize:12}}>{errors.gender}</p>}

              <label>Languages *</label>
              <select name="languages" multiple value={form.languages} onChange={handleChange} style={inputStyle}>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Marathi">Marathi</option>
              </select>
              {errors.languages && <p style={{color:"red", fontSize:12}}>{errors.languages}</p>}

              <label>Profile Picture *</label>
              <input type="file" name="profilePic" onChange={handleChange} accept="image/*" style={inputStyle}/>
              {preview && <img src={preview} alt="preview" style={{ width:100, height:100, borderRadius:8, marginBottom:8 }}/>}
              {errors.profilePic && <p style={{color:"red", fontSize:12}}>{errors.profilePic}</p>}
            </>}

            {step===3 && <>
            <label>Enter OTP *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showOtp ? "text" : "password"}
                    name="otp"
                    value={form.otp}
                    onChange={handleChange}
                    placeholder="Enter OTP"
                    style={inputStyle}
                  />
                  <span onClick={() => setShowOtp(prev => !prev)} style={{ position: "absolute", right: 12, top: 12, cursor: "pointer" }}>
                    {showOtp ? "🙈" : "👁️"}
                  </span>
                </div>
                {errors.otp && <p style={{ color: "red", fontSize: 12 }}>{errors.otp}</p>}

                {/* Dev-only helper: show OTP returned by backend (not for production) */}
                {serverOtp && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#0f766e", background: "#ccfbf1", padding: 8, borderRadius: 6 }}>
                    OTP is <strong>{serverOtp}</strong>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, otp: serverOtp }))}
                      style={{ marginLeft: 10, padding: "4px 8px", borderRadius: 4, border: "none", background: "#14b8a6", color: "#fff", cursor: "pointer" }}
                    >
                      Autofill
                    </button>
                  </div>
                )}

                <div style={{ height: 8, background: "#555", borderRadius: 4, marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${(otpCountdown / 120) * 100}%`, background: "#00ffcc", borderRadius: 4, transition: "width 1s linear" }} />
                </div>
                {otpCountdown === 0 && (
                  <button type="button" onClick={handleResendOtp} style={{
                    marginTop: 10, padding: 10, borderRadius: 6, background: "#00ffcc", color: "#333",
                    border: "none", cursor: "pointer", animation: "pulse 1s infinite"
                  }}>Resend OTP</button>
                )}

               <label style={{ display: "block", marginTop: 15 }}>
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange}/> I accept Terms & Conditions *
              </label>
              {errors.terms && <p style={{color:"red", fontSize:12}}>{errors.terms}</p>}
            </>}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
              {step>1 && <button type="button" onClick={()=>setStep(prev=>prev-1)} style={{ padding:"8px 16px", borderRadius:6 }}>Back</button>}
              {step<3 && <button type="button" onClick={handleNext} style={{ padding:"8px 16px", borderRadius:6 }}>Next</button>}
              {step===3 && <button type="submit" disabled={loading} style={{ padding:"8px 16px", borderRadius:6 }}>{loading?"Submitting...":"Submit"}</button>}
            </div>

            <div>
             <p style={{ marginTop: "16px", fontSize: "14px" }}>
          Already have an account?{" "}
          <button onClick={() => go("staff-login")} style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }}>Login here</button>{" "}
          | <button onClick={() => go("landing")} style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }}>Go to Landing Page 🏠</button>
        </p>
      </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
      `}</style>
    </div>
  );
}
