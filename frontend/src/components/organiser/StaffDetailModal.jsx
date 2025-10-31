import React from "react";

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} onClick={() => onChange(star)} style={{ cursor: "pointer", color: star <= value ? "#f59e0b" : "#d1d5db", fontSize: 20 }}>★</span>
      ))}
    </div>
  );
}

export default function StaffDetailModal({ staff, events, ratingMap, setRatingMap, onClose, onRate, onPay }) {
  if (!staff) return null;

  const ratedEvents = events.filter(e => e.ratedByOrg || ratingMap[events.indexOf(e)]);
  const overallRating = ratedEvents.length
    ? Math.round(ratedEvents.reduce((sum, e, idx) => sum + (e.ratedByOrg ? e.eventRate : ratingMap[idx] || 0), 0) / ratedEvents.length)
    : "Not Rated Yet";

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 8, maxWidth: 800, width: "90%", maxHeight: "80%", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <h3>{staff.staffName} Details</h3>
        <div style={{ marginBottom: 15 }}>
          <strong>Overall Rating: </strong>{overallRating}{ratedEvents.length ? " ⭐" : ""}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Event Name</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Role</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Amount</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Rate</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Payment Mode</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Transaction ID</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Status</th>
              <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((eventItem, idx) => (
              <tr key={`event-row-${staff.staffId}-${idx}`} style={{ borderBottom: "1px solid #eee", backgroundColor: !eventItem.paidStatus ? "#fff7e6" : !eventItem.ratedByOrg ? "#e6f7ff" : "transparent" }}>
                <td style={{ padding: 10 }}>{eventItem.eventName}</td>
                <td style={{ padding: 10 }}>{eventItem.eventRole}</td>
                <td style={{ padding: 10 }}>${eventItem.eventAmount}</td>
                <td style={{ padding: 10 }}>{eventItem.ratedByOrg ? `${eventItem.eventRate} ⭐` : ratingMap[idx] ? `${ratingMap[idx]} ⭐` : "—"}</td>
                <td style={{ padding: 10 }}>{eventItem.paymentMethod || "—"}</td>
                <td style={{ padding: 10 }}>{eventItem.txnId || "—"}</td>
                <td style={{ padding: 10 }}>{eventItem.paidStatus ? <span style={{ color: "green", fontWeight: "bold" }}>Paid</span> : <span style={{ color: "orange" }}>Pending</span>}</td>
                <td style={{ padding: 10, display: "flex", gap: 5, alignItems: "center" }}>
                  {!eventItem.ratedByOrg && (
                    <>
                      <StarRating value={ratingMap[idx] || 0} onChange={(v) => setRatingMap(prev => ({ ...prev, [idx]: v }))} />
                      <button onClick={() => onRate(idx)} style={{ padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginLeft: 5 }}>Rate</button>
                    </>
                  )}
                  {!eventItem.paidStatus && <button onClick={() => onPay(idx)} style={{ padding: "4px 8px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginLeft: 5 }}>Pay</button>}
                  {eventItem.paidStatus && <span style={{ color: "green", fontWeight: "bold" }}>✔</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={onClose} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", marginTop: 15 }}>Close</button>
      </div>
    </div>
  );
}

