// src/pages/StaffLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginStaff } from "../api/api";
import socket, { emitEvent } from "../utils/socket"; // use shared socket instance

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim()) && password.trim().length > 0;

  // --- Socket.IO notifications ---
  useEffect(() => {
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("staff-notification", (msg) => {
      setFeedback(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    });

    return () => {
      socket.off("staff-notification");
    };
  }, []);

  const validateField = (field, value) => {
    let message = "";
    if (field === "email") {
      if (!value) message = "Please enter email";
      else if (!emailRegex.test(value)) message = "Enter a valid email";
    }
    if (field === "password" && !value) message = "Please enter password";
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setFeedback("");

    try {
      const data = await loginStaff({ email: email.trim(), password: password.trim() });
      sessionStorage.setItem("token", data.token);
      login(data.token, data.user || { email });
      setFeedback("Login Successful ✅");
      emitEvent("staff-login", { email: data.user?.email || email });
      navigate("/staff", { replace: true });
    } catch (err) {
      const message = err.message || "Invalid credentials";
      setFeedback(message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (message.toLowerCase().includes("email")) setErrors({ email: "Email didn’t match" });
      else if (message.toLowerCase().includes("password")) setErrors({ password: "Password didn’t match" });
    } finally {
      setLoading(false);
    }
  };

  const bubbles = Array.from({ length: 8 }, () => ({
    size: 50 + Math.random() * 150,
    left: Math.random() * 100 + "%",
    duration: 8 + Math.random() * 10,
    delay: Math.random() * 5,
  }));

  return (
    <div style={{
      position: "relative", overflow: "hidden", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundImage: "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)",
      backgroundSize: "600% 600%", backgroundRepeat: "no-repeat",
      animation: "bgshift 15s ease infinite", color: "#fff"
    }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: "absolute", bottom: `-${b.size}px`, left: b.left,
          width: `${b.size}px`, height: `${b.size}px`, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", animation: `floatUp ${b.duration}s linear ${b.delay}s infinite`
        }} />
      ))}

      <div style={{
        position: "relative", zIndex: 2, padding: "24px", borderRadius: "12px",
        background: "rgba(0,0,0,0.6)", boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
        minWidth: "320px", animation: shake ? "shake 0.5s" : "none"
      }}>
        <h2 style={{ marginBottom: "16px" }}>Staff Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Email *</label>
          <input type="email" value={email} placeholder="Enter your email"
            onChange={(e) => { setEmail(e.target.value); if (feedback) setFeedback(""); if (errors.email) validateField("email", e.target.value); }}
            onBlur={() => validateField("email", email)} />
          {errors.email && <p style={{ color: "red", fontSize: "13px" }}>{errors.email}</p>}

          <label>Password *</label>
          <div style={{ position: "relative" }}>
            <input type={showPassword ? "text" : "password"} value={password} placeholder="Enter your password"
              onChange={(e) => { setPassword(e.target.value); if (feedback) setFeedback(""); if (errors.password) validateField("password", e.target.value); }}
              onBlur={() => validateField("password", password)} />
            <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", userSelect: "none", color: "#00b894" }}>
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
          {errors.password && <p style={{ color: "red", fontSize: "13px" }}>{errors.password}</p>}
          {feedback && <p style={{ color: feedback.includes("Successful") ? "limegreen" : "red", fontSize: "13px", marginTop: 8 }}>{feedback}</p>}

          <button type="submit" disabled={loading || !isValid} style={{ width: "100%", padding: "10px 0", backgroundColor: "#00b894", border: "none", borderRadius: "6px", color: "#fff", fontWeight: "bold", cursor: loading || !isValid ? "not-allowed" : "pointer", opacity: loading || !isValid ? 0.6 : 1 }}>
            {loading ? "Submitting..." : "Login →"}
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "14px" }}>
          Don’t have an account?{" "}
          <Link to="/staff/register" style={{ color: "#00b894", textDecoration: "underline" }}>Register here</Link>{" "}
          | <Link to="/" style={{ color: "#00b894", textDecoration: "underline" }}>Go to Landing Page 🏠</Link>
        </p>
      </div>

      <style>{`
        @keyframes floatUp { 0%{transform:translateY(100vh);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-200px);opacity:0} }
        @keyframes bgshift { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
        @keyframes shake { 0%{transform:translateX(0)}25%{transform:translateX(-5px)}50%{transform:translateX(5px)}75%{transform:translateX(-5px)}100%{transform:translateX(0)} }
        input { width:100%; padding:8px 12px; margin:8px 0 4px 0; border-radius:6px; border:none; outline:none; box-sizing:border-box; }
      `}</style>
    </div>
  );
}
