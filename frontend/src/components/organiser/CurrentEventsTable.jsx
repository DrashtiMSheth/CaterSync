import React from "react";
import PropTypes from "prop-types";

export default function CurrentEventsTable({ now, events, onEdit }) {
  const th = { padding: "12px", border: "1px solid #ccc", background: "#f3f4f6", fontWeight: "bold" };
  const td = { padding: "12px", border: "1px solid #ccc", verticalAlign: "top" };

  const formatDateTime = (dt) => (dt ? String(dt).replace("T", " ") : "-");
  const isEditable = (event) => {
    const start = new Date(event.startDateTime || event.startDate || Date.now());
    const cutoff = new Date(start);
    cutoff.setDate(cutoff.getDate() - 2);
    return now < cutoff;
  };

  const rows = (events || []).map((e) => {
    const start = new Date(e.startDateTime || e.startDate || Date.now());
    const end = new Date(e.endDateTime || e.endDate || start);
    const isCurrent = start <= now && end >= now;
    return { e, start, end, isCurrent };
  });

  const sorted = [
    ...rows.filter((r) => r.isCurrent),
    ...rows.filter((r) => !r.isCurrent && r.start > now),
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Current / Upcoming Events</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 700 }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Start</th>
              <th style={th}>End</th>
              <th style={th}>Location</th>
              <th style={th}>Staff & Budget</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ e, isCurrent }) => (
              <tr key={e._id || e.id || e.name} style={{ backgroundColor: isCurrent ? "#d1fae5" : "transparent" }}>
                <td style={td}>{e.name || e.eventName || "—"}</td>
                <td style={td}>{formatDateTime(e.startDateTime || e.startDate)}</td>
                <td style={td}>{formatDateTime(e.endDateTime || e.endDate)}</td>
                <td style={td}>{e.location || "—"}</td>
                <td style={td}>
                  {Object.entries(e.staff || {}).map(([role, data]) => {
                    const male = Number(data?.male || 0);
                    const female = Number(data?.female || 0);
                    const assigned = male + female;
                    const required = Number(data?.required || assigned);
                    const budget = data?.paymentPerEvent
                      ? data.paymentPerEvent
                      : assigned * (Number(data?.hoursWorked || 0) * Number(data?.paymentPerHour || 0));
                    const pct = required ? Math.min((assigned / required) * 100, 100) : 0;
                    return (
                      <div key={role} style={{ marginBottom: 6 }}>
                        <div>{role}: {assigned} assigned ({budget}$)</div>
                        <div style={{ background: "#e5e7eb", borderRadius: 6, height: 12, width: "100%" }}>
                          <div style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : pct > 0 ? "#facc15" : "#ef4444", height: "100%", borderRadius: 6 }} />
                        </div>
                      </div>
                    );
                  })}
                </td>
                <td style={td}>
                  {!isCurrent && isEditable(e) && (
                    <button onClick={() => onEdit?.(e)} style={{ padding: "6px 12px", border: "none", borderRadius: "6px", background: "#3b82f6", color: "white", cursor: "pointer" }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ padding: 12, color: "#555" }}>No events to display.</div>
        )}
      </div>
    </div>
  );
}

CurrentEventsTable.propTypes = {
  now: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.array,
  onEdit: PropTypes.func,
};

