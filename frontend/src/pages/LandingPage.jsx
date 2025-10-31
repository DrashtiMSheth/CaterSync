import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage({
  logo = "🔗 CaterSync",
  title = "CaterSync — Where Organisers and Staff Work in Perfect Sync",
  subtitle = "From chaos to coordination — bringing organisers and staff together through code.",
  organiserBtnLabel = "📋 Organiser Entrance", 
  staffBtnLabel = "👨‍🍳 Staff Entrance",
  footerText,
}) {
  const navigate = useNavigate();
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
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(120deg, #1e90ff, #00b894, #6c5ce7)", backgroundSize: "600% 600%", animation: "gradientShift 15s ease infinite" }}>
      {/* Floating bubbles */}
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

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#fff", padding: "20px" }}>
        <div className="logo" style={{ fontSize: "3rem", marginBottom: 20 }}>{logo}</div>
        <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: 12 }}>{title}</h1>
        <p className="hero-sub" style={{ fontSize: "1.2rem", marginBottom: 24 }}>{subtitle}</p>

        <div className="entrances" style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
          <button
            className="entry btn-organiser"
            onClick={() => navigate("/organiser/login")}
            style={{ padding: "12px 24px", borderRadius: "8px", background: "#00b894", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer", transition: "0.3s" }}
          >
            {organiserBtnLabel}
          </button>
          <button
            className="entry btn-staff"
            onClick={() => navigate("/staff/login")}
            style={{ padding: "12px 24px", borderRadius: "8px", background: "#6c5ce7", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer", transition: "0.3s" }}
          >
            {staffBtnLabel}
          </button>
        </div>

        <footer className="footer" style={{ fontSize: "0.9rem" }}>
          {footerText || `© ${new Date().getFullYear()} CaterSync Platform`}
        </footer>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-200px); opacity: 0; }
        }
        @keyframes gradientShift {
          0% { background-position:0% 50%; }
          50% { background-position:100% 50%; }
          100% { background-position:0% 50%; }
        }
        .entry:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
