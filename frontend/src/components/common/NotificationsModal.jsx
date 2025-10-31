import React from "react";

export default function NotificationsModal({ open, notifications, onClose, onAccept, onReject }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Notifications</h3>
          <button onClick={onClose} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>Close</button>
        </div>
        {notifications.length === 0 ? (
          <div style={{ padding: 10, textAlign: "center" }}>No notifications</div>
        ) : (
          <div>
            {notifications.map(n => (
              <div key={n.id} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                <div style={{ fontSize: 14, marginBottom: 6 }}>{n.message}</div>
                {n.type === "apply" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => onAccept?.(n.id)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Accept</button>
                    <button onClick={() => onReject?.(n.id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

