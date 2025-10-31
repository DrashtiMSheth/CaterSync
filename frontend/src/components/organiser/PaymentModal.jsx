import React from "react";

export default function PaymentModal({ open, event, onClose, onSubmit }) {
  if (!open || !event) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: 400, width: "90%", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <h3>Confirm Payment</h3>
        <div style={{ marginBottom: 10 }}>Amount: ${event.eventAmount}</div>
        <div style={{ marginBottom: 10 }}>
          <label>Payment Mode: </label><br />
          <select id="payment-mode-unique" style={{ width: "100%", padding: 8, marginTop: 5 }}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSubmit(document.getElementById("payment-mode-unique").value)} style={{ padding: "4px 8px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Confirm Pay</button>
        </div>
      </div>
    </div>
  );
}

