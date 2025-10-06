// src/pages/StaffRegistration.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Generate demo OTP
const generateDemoOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Map Components ---
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
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
          setCoords([lat, lng]);
          setForm(prev => ({
            ...prev,
            lat,
            lng,
            address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
          }));
        },
      }}
    />
  ) : null;
}

function ChangeMapView({ coords }) {
  const map = useMap();
  if (coords) map.setView(coords, 13);
  return null;
}

// --- Staff Registration Component ---
export default function StaffRegistration({ go, loading, setLoading }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
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
    otp: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({ label: "", color: "" });
  const [coords, setCoords] = useState([20.5937, 78.9629]);// default India
  const [completedSteps, setCompletedSteps] = useState([]);

  const formRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    const pw = form.password;
    if (!pw) setPasswordStrength("");
    else if (pw.length < 8) setPasswordStrength("Weak");
    else if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[@$!%*?&]/.test(pw))
      setPasswordStrength("Strong");
    else setPasswordStrength("Medium");
  }, [form.password]);

  useEffect(() => {
    if (otpExpiry) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
        setOtpCountdown(remaining);
        if (remaining === 0) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpExpiry]);

  useEffect(() => {
    // Auto-scroll to top on step change
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step]);

  // --- Handlers ---
  const change = (e) => {
    const { name, type, value, checked, files } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));

    if (type === "file") {
      const file = files[0];
      if (file && file.size > 5 * 1024 * 1024) return; // max 5MB
      setForm(s => ({ ...s, [name]: file || null }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else if (type === "checkbox") setForm(s => ({ ...s, [name]: checked }));
    else if (type === "select-multiple") {
      const options = Array.from(e.target.selectedOptions, opt => opt.value);
      setForm(s => ({ ...s, [name]: options }));
    } else setForm(s => ({ ...s, [name]: value }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.fullName) newErrors.fullName = "Please enter full name";
    if (!form.email) newErrors.email = "Please enter email";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.phone) newErrors.phone = "Please enter phone";
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = "Phone must be 10 digits";
    if (!form.password) newErrors.password = "Please enter password";
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.role) newErrors.role = "Select role";
    if (!form.skills.length) newErrors.skills = "Select at least one skill";
    if (!form.city) newErrors.city = "Enter preferred work city";
    if (!form.availability) newErrors.availability = "Enter availability";
    if (!form.gender) newErrors.gender = "Select gender";
    if (!form.languages.length) newErrors.languages = "Select at least one language";
    if (!form.profilePic) newErrors.profilePic = "Upload profile picture";
    return newErrors;
  };

  const handleNext = () => {
    const newErrors = step === 1 ? validateStep1() : validateStep2();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;

    // Mark step as completed
    setCompletedSteps(prev => [...new Set([...prev, step])]);

    // OTP generation for step 3
    if (step === 2) {
      const otp = generateDemoOtp();
      setGeneratedOtp(otp);
      setOtpExpiry(Date.now() + 120000);
      alert(`📩 Demo OTP: ${otp}`);
    }

    setStep(prev => prev + 1);
  };

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!otpExpiry || Date.now() > otpExpiry) newErrors.otp = "OTP expired";
    else if (!form.otp) newErrors.otp = "Please enter OTP";
    else if (form.otp !== generatedOtp) newErrors.otp = "Invalid OTP";
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
      const res = await fetch("http://localhost:5050/api/staff/register", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) alert(data.message || "Server error");
      else {
        alert("🎉 Registration successful!");
        go("staff-login");
      }
    } catch (err) {
      alert("⚠️ Server connection failed");
    }
    setLoading(false);
  };

  // --- Styles ---
  const inputStyle = { width: "100%", padding: "12px", margin: "8px 0 16px", borderRadius: "8px", border: "1px solid #ccc" };

  // --- Bubbles effect ---
  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    size: 50 + Math.random() * 150,
    left: Math.random() * 100 + "%",
    duration: 8 + Math.random() * 10,
    delay: Math.random() * 5,
  }));

  // --- Password bar color ---
  const getPasswordBarColor = () => {
    switch (passwordStrength) {
      case "Weak": return "red";
      case "Medium": return "orange";
      case "Strong": return "green";
      default: return "transparent";
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }} ref={formRef}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: `-${b.size}px`,
          left: b.left,
          width: `${b.size}px`,
          height: `${b.size}px`,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          animation: `floatUp ${b.duration}s linear ${b.delay}s infinite`
        }}></div>
      ))}

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)",
        backgroundSize: "600% 600%",
        animation: "gradientShift 15s ease infinite",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "600px",
          background: "rgba(0,0,0,0.6)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          padding: "30px",
          borderRadius: "16px",
          color: "#fff",
          zIndex: 2,
          animation: "fadeSlide 0.5s ease",
        }}>
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>Staff Registration</h2>

          {/* --- Step Progress --- */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            {["Step 1", "Step 2", "Step 3"].map((s, i) => {
              const stepNum = i + 1;
              const isCompleted = completedSteps.includes(stepNum);
              return (
                <div key={i} style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px",
                  borderBottom: step >= stepNum ? "4px solid #660bc7db" : "4px solid #555",
                  color: step >= stepNum ? "#fff" : "#bbb",
                  fontWeight: step === stepNum ? "bold" : "normal",
                  position: "relative"
                }}>
                  {s} {isCompleted && <span style={{ color: "#00ffcc", marginLeft: 4 }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* --- Form --- */}
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {step === 1 && (
              <div style={{ animation: "fadeSlide 0.5s ease" }}>
                <label>Full Name *</label>
                <input name="fullName" value={form.fullName} onChange={change} style={inputStyle} placeholder="Enter Full Name" />
                {errors.fullName && <p style={{ color: "red", fontSize: 12 }}>{errors.fullName}</p>}

                <label>Email *</label>
                <input type="email" name="email" value={form.email} onChange={change} style={inputStyle} placeholder="Enter Email" />
                {errors.email && <p style={{ color: "red", fontSize: 12 }}>{errors.email}</p>}

                <label>Phone *</label>
                <input name="phone" value={form.phone} onChange={change} style={inputStyle} placeholder="Enter Phone" />
                {errors.phone && <p style={{ color: "red", fontSize: 12 }}>{errors.phone}</p>}

                <label>Password *</label>
                <input type="password" name="password" value={form.password} onChange={change} style={inputStyle} placeholder="Enter Password" />
                {errors.password && <p style={{ color: "red", fontSize: 12 }}>{errors.password}</p>}
                {form.password && (
                  <div style={{ height: 8, width: "100%", borderRadius: 4, background: "#555", marginTop: 4 }}>
                    <div style={{
                      width: `${passwordStrength === "Weak" ? 33 : passwordStrength === "Medium" ? 66 : 100}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: getPasswordBarColor(),
                      transition: "width 0.3s ease"
                    }}></div>
                  </div>
                )}
              </div>
            )}

               {/* Step 2 */}
            {step === 2 && (
              <div style={{ animation: "fadeSlide 0.5s ease" }}>
                <label>Role *</label>
                <select name="role" value={form.role} onChange={change} style={inputStyle}>
                  <option value="">Select Role</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Chef">Chef</option>
                  <option value="Cleaner">Cleaner</option>
                </select>
                {errors.role && <p style={{ color: "red", fontSize: 12 }}>{errors.role}</p>}

                <label>Skills *</label>
                <select name="skills" multiple value={form.skills} onChange={change} style={inputStyle}>
                  <option value="Service">Service</option>
                  <option value="Cooking">Cooking</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Bartending">Bartending</option>
                </select>
                {errors.skills && <p style={{ color: "red", fontSize: 12 }}>{errors.skills}</p>}

                <label>City *</label>
                <input name="city" value={form.city} onChange={change} style={inputStyle} placeholder="Enter City" />
                <button type="button" onClick={handleCitySearch} style={{ marginBottom: 8, padding: "6px 12px", borderRadius: 6 }}>Search City</button>
                {errors.city && <p style={{ color: "red", fontSize: 12 }}>{errors.city}</p>}

                <label>Map Location</label>
                <MapContainer center={coords} zoom={13} style={{ height: 200, borderRadius: 8, marginBottom: 12 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker setForm={setForm} coords={coords} setCoords={setCoords} />
                  <ChangeMapView coords={coords} />
                </MapContainer>

                <label>Availability *</label>
                <input name="availability" value={form.availability} onChange={change} style={inputStyle} placeholder="Enter Availability" />
                {errors.availability && <p style={{ color: "red", fontSize: 12 }}>{errors.availability}</p>}

                <label>Gender *</label>
                <select name="gender" value={form.gender} onChange={change} style={inputStyle}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p style={{ color: "red", fontSize: 12 }}>{errors.gender}</p>}

                <label>Languages *</label>
                <select name="languages" multiple value={form.languages} onChange={change} style={inputStyle}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Marathi">Marathi</option>
                </select>
                {errors.languages && <p style={{ color: "red", fontSize: 12 }}>{errors.languages}</p>}

                <label>Profile Picture *</label>
                <input type="file" name="profilePic" onChange={change} accept="image/*" style={inputStyle} />
                {preview && <img src={preview} alt="preview" style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 8 }} />}
                {errors.profilePic && <p style={{ color: "red", fontSize: 12 }}>{errors.profilePic}</p>}
              </div>
            )}

         
            {/* Step 3 OTP */}
            {step === 3 && (
              <div style={{ animation: "fadeSlide 0.5s ease" }}>
                <label>OTP *</label>
                <input name="otp" value={form.otp} onChange={change} style={inputStyle} placeholder="Enter OTP" />
                {errors.otp && <p style={{ color: "red", fontSize: 12 }}>{errors.otp}</p>}
                <p>OTP expires in {otpCountdown}s</p>

                <label>
                  <input type="checkbox" name="terms" checked={form.terms} onChange={change} /> I accept Terms & Conditions *
                </label>
                {errors.terms && <p style={{ color: "red", fontSize: 12 }}>{errors.terms}</p>}
              </div>
            )}

            {/* --- Navigation Buttons --- */}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#555",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Back
                </button>
              )}
              {step < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={Object.keys(step === 1 ? validateStep1() : validateStep2()).length > 0}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: Object.keys(step === 1 ? validateStep1() : validateStep2()).length > 0 ? "#888" : "#00b894",
                    color: "#fff",
                    cursor: Object.keys(step === 1 ? validateStep1() : validateStep2()).length > 0 ? "not-allowed" : "pointer",
                    transition: "0.3s all"
                  }}
                >
                  Next
                </button>
              )}
              {step === 3 && (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#00b894",
                    color: "#fff",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button type="button" onClick={() => go("staff-login")} style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }}>Already have an account? Login</button>
              <br />
              <button type="button" onClick={() => go("landing")} style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }}>Go to Landing Page 🏠</button>
            </div>
            
          </form>
        </div>
      </div>

      <style>
        {`
        @keyframes gradientShift {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes floatUp {
          0%{transform:translateY(0)}
          100%{transform:translateY(-120vh)}
        }
        @keyframes fadeSlide {
          0%{opacity:0; transform:translateY(20px)}
          100%{opacity:1; transform:translateY(0)}
        }
        form div[style*="fadeSlide"] {
          animation: fadeSlide 0.5s ease;
        }
      `}
      </style>
    </div>
  );
}
