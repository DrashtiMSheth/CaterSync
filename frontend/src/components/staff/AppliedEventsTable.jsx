import React from "react";
import PropTypes from "prop-types";

export default function AppliedEventsTable({ data, onCancel, onReapply, reapplyMode, onConfirmReapply, availableRoles }) {
  const td = { padding: "8px", borderBottom: "1px solid #ddd", textAlign: "center" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
      <thead>
        <tr style={{ background: "#000", color: "#fff" }}>
          {["Event Name", "Start Date & Time", "End Date & Time", "Location", "Select Role", "Budget", "Status", "Action"].map((c) => (
            <th key={c} style={td}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((event, i) => {
          const applied = event.applied;
          const roles = availableRoles(event, applied);
          const isReapply = reapplyMode === event.name;
          return (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", color: "#000" }}>
              <td style={td}>{event.name}</td>
              <td style={td}>{event.startDate} {event.startTime}</td>
              <td style={td}>{event.endDate} {event.endTime}</td>
              <td style={td}>{event.location}</td>
              <td style={td}>
                {isReapply ? (
                  <select defaultValue="" onChange={(e) => onConfirmReapply(event.name, e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff" }}>
                    <option value="">-- Select Role --</option>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  applied?.selectedRole || "—"
                )}
              </td>
              <td style={td}>{applied?.budget || "-"}</td>
              <td style={td}>{applied?.status || "Not Applied"}</td>
              <td style={td}>
                {applied?.status === "Applied (Pending Approval)" && (
                  <button onClick={() => onCancel(event.name)} style={{ background: "#ff4d4d", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                )}
                {(applied?.status === "Rejected" || applied?.status === "Cancelled") && !isReapply && (
                  <button onClick={() => onReapply(event.name)} style={{ background: "#007bff", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}>Reapply</button>
                )}
              </td>
            </tr>
          );
        })}
        {data.length === 0 && (
          <tr>
            <td style={td} colSpan={8}>No applied events</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

AppliedEventsTable.propTypes = {
  data: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  onReapply: PropTypes.func.isRequired,
  reapplyMode: PropTypes.string,
  onConfirmReapply: PropTypes.func.isRequired,
  availableRoles: PropTypes.func.isRequired,
};

