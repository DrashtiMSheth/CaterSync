import React, { useState, useEffect } from "react";
import { registerOrganiser  } from "../api/api";

// Helper to determine password strength
function getPasswordStrength(pw) {
  if (!pw) return { label: "", color: "" };
  if (pw.length < 8) return { label: "Weak", color: "red" };
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[@$!%*?&]/.test(pw))
    return { label: "Strong", color: "green" };
  return { label: "Medium", color: "orange" };
}

export default function OrganiserRegistration({ go }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    organiserName: "",
    businessType: "",
    officeAddress: "",
    website: "",
    companyLogo: null,
    otp: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [serverOtp, setServerOtp] = useState(""); 
  const [passwordStrength, setPasswordStrength] = useState({ label: "", color: "" });
  const [completedSteps, setCompletedSteps] = useState([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  // Password strength
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(form.password));
  }, [form.password]);

  // OTP countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setInterval(() => setOtpCountdown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [otpCountdown]);

  function change(e) {
    const { name, type, value, checked, files } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));

    if (type === "file") {
      const file = files[0];
      if (file && file.size > 200 * 1024 * 1024) return alert("Company logo must be < 200MB");
      setForm(prev => ({ ...prev, [name]: file || null }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else if (type === "checkbox") {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  // Step validations
  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName) errs.fullName = "Enter full name";
    if (!form.email) errs.email = "Enter email";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.phone) errs.phone = "Enter phone";
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = "Phone must be 10 digits";
    if (!form.password) errs.password = "Enter password";
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.organiserName) errs.organiserName = "Please enter organisation name";
    else if (form.organiserName.length < 8) errs.organiserName = "Organisation name must be at least 8 letters";
    if (!form.businessType) errs.businessType = "Please select business type";
    if (!form.officeAddress) errs.officeAddress = "Please enter valid office address";
    if (!form.website) errs.website = "Please enter website";
    if (!form.companyLogo) errs.companyLogo = "Please select company logo";
    return errs;
  };

  const isStepValid = () => {
    const errs = step === 1 ? validateStep1() : step === 2 ? validateStep2() : {};
    return Object.keys(errs).length === 0;
  };

  async function handleNext() {
    const newErrors = step === 1 ? validateStep1() : step === 2 ? validateStep2() : {};
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    if (step === 2) {
      // Generate temporary OTP for testing
      const tempOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Temporary OTP:", tempOtp);
      setServerOtp(tempOtp);
      setOtpCountdown(120);
    }

    setCompletedSteps(prev => [...new Set([...prev, step])]);
    setStep(prev => prev + 1);
  }

 async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!form.otp) newErrors.otp = "Enter OTP";
    else if (form.otp !== serverOtp) newErrors.otp = "Invalid OTP";
    if (!form.terms) newErrors.terms = "Accept Terms & Conditions";
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setInternalLoading(true);
    try {
      const payload = new FormData();
      Object.keys(form).forEach(key => {
        if (key === "companyLogo" && form[key]) payload.append(key, form[key]);
        else payload.append(key, form[key]);
      });

      const response = await registerOrganiser(payload); // call API
      console.log("Registration success:", response);

      alert("✅ Registration Successful");
      go("organiser-login");
    } catch (err) {
      console.error("Registration error:", err);
      alert("❌ Registration failed");
    } finally {
      setInternalLoading(false);
    }
  }
  const inputStyle = { width: "100%", padding: "12px", margin: "8px 0 16px", borderRadius: "8px", border: "1px solid #ccc" };
  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    size: 50 + Math.random() * 150,
    left: Math.random() * 100 + "%",
    duration: 8 + Math.random() * 10,
    delay: Math.random() * 5,
  }));

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: "absolute", bottom: `-${b.size}px`, left: b.left,
          width: `${b.size}px`, height: `${b.size}px`,
          borderRadius: "50%", background: "rgba(255,255,255,0.1)",
          animation: `floatUp ${b.duration}s linear ${b.delay}s infinite`,
        }} />
      ))}

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)", backgroundSize: "600% 600%",
        animation: "gradientShift 15s ease infinite", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          width: "100%", maxWidth: "600px", background: "rgba(0,0,0,0.6)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", padding: "30px",
          borderRadius: "16px", color: "#fff", zIndex: 2, animation: "fadeSlide 0.5s ease",
        }}>
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>Organiser Registration</h2>

          {/* Step Progress */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            {["Step 1", "Step 2", "Step 3"].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "10px",
                borderBottom: step > i ? "4px solid #660bc7db" : "4px solid #555",
                color: step > i ? "#660bc7db" : "#bbb",
                fontWeight: step === i + 1 ? "bold" : "normal",
                position: "relative",
              }}>
                {s}
                {completedSteps.includes(i + 1) && <span style={{ color: "limegreen", marginLeft: 5 }}>✓</span>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {step === 1 && (
              <div>
                <label>Full Name *</label>
                <input name="fullName" value={form.fullName} onChange={change} placeholder="Enter full name" style={inputStyle} />
                {errors.fullName && <p style={{ color: "red", fontSize: 12 }}>{errors.fullName}</p>}

                <label>Email *</label>
                <input type="email" name="email" value={form.email} onChange={change} placeholder="Enter email" style={inputStyle} />
                {errors.email && <p style={{ color: "red", fontSize: 12 }}>{errors.email}</p>}

                <label>Phone *</label>
                <input name="phone" value={form.phone} onChange={change} placeholder="Enter 10-digit phone" style={inputStyle} />
                {errors.phone && <p style={{ color: "red", fontSize: 12 }}>{errors.phone}</p>}

                <label>Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={change}
                    placeholder="Enter password"
                    style={inputStyle}
                    onFocus={() => setTooltipVisible(true)}
                    onBlur={() => setTooltipVisible(false)}
                  />
                  <span
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{ position: "absolute", right: 12, top: 12, cursor: "pointer" }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </span>
                  {tooltipVisible && <div style={{
                    position: "absolute", top: "40px", left: "0", background: "#333", padding: "5px 10px", borderRadius: 4,
                    fontSize: 12, color: "#fff"
                  }}>Include uppercase, lowercase, number & symbol</div>}
                </div>
                <div style={{ height: 8, width: "100%", background: "#555", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${passwordStrength.label === "Weak" ? 33 : passwordStrength.label === "Medium" ? 66 : 100}%`, background: passwordStrength.color, borderRadius: 4 }} />
                </div>
                {passwordStrength.label && <p style={{ fontSize: 12 }}>{passwordStrength.label}</p>}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <label>Organisation Name *</label>
                <input name="organiserName" value={form.organiserName} onChange={change} placeholder="Enter organisation name" style={inputStyle} />
                {errors.organiserName && <p style={{ color: "red", fontSize: 12 }}>{errors.organiserName}</p>}

                <label>Business Type *</label>
                <select name="businessType" value={form.businessType} onChange={change} style={inputStyle}>
                  <option value="">Select business type</option>
                  <option value="Event Management">Event Management</option>
                  <option value="Catering">Catering</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
                {errors.businessType && <p style={{ color: "red", fontSize: 12 }}>{errors.businessType}</p>}

                <label>Office Address *</label>
                <input name="officeAddress" value={form.officeAddress} onChange={change} placeholder="Enter office address" style={inputStyle} />
                {errors.officeAddress && <p style={{ color: "red", fontSize: 12 }}>{errors.officeAddress}</p>}

                <label>Website *</label>
                <input name="website" value={form.website} onChange={change} placeholder="Enter website" style={inputStyle} />
                {errors.website && <p style={{ color: "red", fontSize: 12 }}>{errors.website}</p>}

                <label>Company Logo *</label>
                <input type="file" name="companyLogo" onChange={change} accept="image/*" style={inputStyle} />
                {errors.companyLogo && <p style={{ color: "red", fontSize: 12 }}>{errors.companyLogo}</p>}
                {preview && <img src={preview} alt="Logo preview" style={{ width: 100, marginTop: 12, cursor: "pointer", borderRadius: 8, border: "3px solid #00ffcc" }} />}
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <label>Enter OTP *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showOtp ? "text" : "password"}
                    name="otp"
                    value={form.otp}
                    onChange={change}
                    placeholder="Enter OTP"
                    style={inputStyle}
                  />
                  <span
                    onClick={() => setShowOtp(prev => !prev)}
                    style={{ position: "absolute", right: 12, top: 12, cursor: "pointer" }}
                  >
                    {showOtp ? "🙈" : "👁️"}
                  </span>
                </div>
                {errors.otp && <p style={{ color: "red", fontSize: 12 }}>{errors.otp}</p>}

                {serverOtp && <p style={{ color: "lightgreen", fontSize: 12 }}>Temporary OTP (for testing): {serverOtp}</p>}

                <div style={{ height: 8, background: "#555", borderRadius: 4, marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${(otpCountdown / 120) * 100}%`, background: "#00ffcc", borderRadius: 4, transition: "width 1s linear" }} />
                </div>
                {otpCountdown > 0 ? <p>OTP expires in: {otpCountdown}s</p> : (
                  <button type="button" onClick={handleNext} style={{
                    marginTop: 10, padding: 10, borderRadius: 6, background: "#00ffcc", color: "#333",
                    border: "none", cursor: "pointer", animation: "pulse 1s infinite"
                  }}>Resend OTP</button>
                )}

                <label style={{ display: "block", marginTop: 15 }}>
                  <input type="checkbox" name="terms" checked={form.terms} onChange={change} /> I agree to Terms
                </label>
                {errors.terms && <p style={{ color: "red", fontSize: 12 }}>{errors.terms}</p>}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              {step > 1 && <button type="button" onClick={() => setStep(step - 1)} style={{ padding: "10px 20px", borderRadius: "8px", background: "#555", color: "#fff", border: "none" }}>← Back</button>}
              {step < 3 ? <button type="button" onClick={handleNext} disabled={!isStepValid()} style={{
                padding: "10px 20px", borderRadius: "8px", background: !isStepValid() ? "#333" : "#6600ff9d", color: "#fff", border: "none", fontWeight: "bold", cursor: !isStepValid() ? "not-allowed" : "pointer"
              }}>Next →</button>
                : <button type="submit" disabled={internalLoading} style={{ padding: "10px 20px", borderRadius: "8px", background: "#6600ff9d", color: "#333", border: "none", fontWeight: "bold" }}>{internalLoading ? "Submitting..." : "Submit ✅"}</button>}
            </div>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button type="button" onClick={() => go("organiser-login")} style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }}>Already have an account? Login</button>
              <br />
              <button type="button" onClick={() => go("landing")} style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }}>Go to Landing Page 🏠</button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift { 0% {background-position:0% 50%;} 50% {background-position:100% 50%;} 100% {background-position:0% 50%;} }
        @keyframes floatUp { 0% { transform: translateY(100vh); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform: translateY(-200px); opacity:0; } }
        @keyframes fadeSlide { from {opacity:0; transform:translateY(15px);} to {opacity:1; transform:translateY(0);} }
        @keyframes pulse { 0% { transform: scale(1);} 50% { transform: scale(1.05);} 100% { transform: scale(1);} }
      `}</style>
    </div>
  );
}
