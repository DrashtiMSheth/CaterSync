import React from "react";

export default function Sidebar({ open, items, onToggle, onSelect, active }) {
  return (
    <div style={{ width: open ? 220 : 60, background: "#1f2937", color: "#fff", transition: "width 0.3s", display: "flex", flexDirection: "column" }}>
      <button style={{ margin: 10, background: "#374151", color: "#fff", border: "none", padding: 10, cursor: "pointer" }} onClick={onToggle}>☰</button>
      {items.map(item => (
        <div key={item.name} onClick={() => onSelect(item.name)} style={{
          padding: 15, cursor: "pointer",
          background: active === item.name ? "#111827" : "transparent",
          display: "flex", alignItems: "center", gap: open ? 10 : 0,
          justifyContent: open ? "flex-start" : "center", whiteSpace: "nowrap", overflow: "hidden",
        }}>
          <span>{item.icon}</span>{open && <span>{item.name}</span>}
        </div>
      ))}
    </div>
  );
}

