import React from "react";
import PropTypes from "prop-types";

export default function PaymentsTable({ rows, onRequestPayment }) {
  const th = { padding: 10, textAlign: "center" };
  const td = { padding: 10, textAlign: "center", verticalAlign: "middle" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
      <thead>
        <tr style={{ background: "#111827", color: "#fff" }}>
          {["Event Name", "Start", "Location", "Worked Role", "Budget", "Payment Mode", "Status", "Action"].map((c) => (
            <th key={c} style={th}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((p, i) => {
          const isCompleted = String(p.status || "").toLowerCase() === "completed";
          const isNotAttended = String(p.status || "").toLowerCase() === "not attended";
          const isPaid = p.paymentReceived === true;
          return (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
              <td style={td}>{p.event}</td>
              <td style={td}>{p.startDate} {p.startTime}</td>
              <td style={td}>{p.location}</td>
              <td style={td}>{p.workedRole}</td>
              <td style={td}>${p.budget}</td>
              <td style={td}>{p.paymentMode || "—"}</td>
              <td style={td}>{p.status}</td>
              <td style={td}>
                {isNotAttended ? (
                  "—"
                ) : isCompleted ? (
                  isPaid ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>Paid</span>
                  ) : (
                    <button onClick={() => onRequestPayment?.(p)} style={{ padding: "5px 10px", background: "#007bff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Request Payment</button>
                  )
                ) : (
                  "—"
                )}
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td style={td} colSpan={8}>No payments</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

PaymentsTable.propTypes = {
  rows: PropTypes.array.isRequired,
  onRequestPayment: PropTypes.func,
};

