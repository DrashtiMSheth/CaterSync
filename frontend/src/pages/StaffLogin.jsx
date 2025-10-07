import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { loginStaff  } from "../api/api"; // centralized API import

export default function StaffLogin({ go, loading, setLoading }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [shake, setShake] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // simple validity check (NO state updates here)
  const isValid = emailRegex.test(email) && password.length > 0;

  const validateField = (field, value) => {
    let message = "";
    if (field === "email") {
      if (!value) message = "Please enter email";
      else if (!emailRegex.test(value)) message = "Enter a valid email";
    }
    if (field === "password") {
      if (!value) message = "Please enter password";
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setFeedback("");
    try {
      // Use centralized API
      const data = await loginStaff ({ email, password });

      // Success
      localStorage.setItem("staffToken", data.token); // Staff-specific token
      login(data.token, data.user || { email });
      setFeedback("Login Successful ✅");
      go("staff-dashboard"); // Staff-specific dashboard
    } catch (err) {
      console.error("Login error:", err);
      setFeedback(err.message || "⚠️ Invalid credentials or server error");
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Optional field-specific error handling
      if (err.message?.toLowerCase().includes("email")) setErrors({ email: "Email didn’t match" });
      else if (err.message?.toLowerCase().includes("password")) setErrors({ password: "Password didn’t match" });
    }
    setLoading(false);
  };

  // Floating bubbles
  const bubbles = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      size: 50 + Math.random() * 150,
      left: Math.random() * 100 + "%",
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage:
          "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)",
        backgroundSize: "600% 600%",
        backgroundRepeat: "no-repeat",
        animation: "bgshift 15s ease infinite",
        color: "#fff",
      }}
    >
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
            background: "rgba(255,255,255,0.1)",
            animation: `floatUp ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "24px",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.6)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
          minWidth: "320px",
          animation: shake ? "shake 0.5s" : "none",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>Staff Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Email *</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
               if (feedback) setFeedback("");
              if (errors.email) validateField("email", e.target.value);
            }}
            onBlur={() => validateField("email", email)}
          />
          {errors.email && <p style={{ color: "red", fontSize: "13px" }}>{errors.email}</p>}

          <label>Password *</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                 if (feedback) setFeedback("");
                if (errors.password) validateField("password", e.target.value);
              }}
              onBlur={() => validateField("password", password)}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                userSelect: "none",
                color: "#00b894",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
          {errors.password && <p style={{ color: "red", fontSize: "13px" }}>{errors.password}</p>}

          {feedback && <p style={{ color: feedback.includes("Successful") ? "limegreen" : "red", fontSize: "13px", marginTop: 8 }}>{feedback}</p>}

          <div style={{ marginTop: "16px" }}>
            <button
              type="submit"
              disabled={loading || !isValid}
              style={{
                width: "100%",
                padding: "10px 0",
                backgroundColor: "#00b894",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontWeight: "bold",
                cursor: loading || !isValid ? "not-allowed" : "pointer",
                opacity: loading || !isValid ? 0.6 : 1,
              }}
            >
              {loading ? "Submitting..." : "Login →"}
            </button>
          </div>
        </form>

        <p style={{ marginTop: "16px", fontSize: "14px" }}>
          Don’t have an account?{" "}
          <button style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }} onClick={() => go("staff-register")}>
            Register here
          </button>{" "}
          |{" "}
          <button style={{ background: "none", border: "none", color: "#00b894", textDecoration: "underline", cursor: "pointer" }} onClick={() => go("landing")}>
            Go to Landing Page 🏠
          </button>
        </p>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-200px); opacity: 0; }
        }
        @keyframes bgshift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
        input {
          width: 100%;
          padding: 8px 12px;
          margin: 8px 0 4px 0;
          border-radius: 6px;
          border: none;
          outline: none;
        }
      `}</style>
    </div>
  );
}
