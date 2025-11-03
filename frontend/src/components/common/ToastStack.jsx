import React from "react";

export default function ToastStack({ toasts = [], onClose }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: t.type === "error" ? "#fee2e2" : t.type === "success" ? "#dcfce7" : "#eef2ff", color: "#111827", border: "1px solid #e5e7eb", borderLeft: `4px solid ${t.type === "error" ? "#ef4444" : t.type === "success" ? "#10b981" : "#6366f1"}`, padding: "10px 12px", borderRadius: 6, minWidth: 280, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
            <button onClick={() => onClose?.(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280" }}>✕</button>
          </div>
          {t.message && <div style={{ fontSize: 13, marginTop: 4 }}>{t.message}</div>}
        </div>
      ))}
    </div>
  );
}

