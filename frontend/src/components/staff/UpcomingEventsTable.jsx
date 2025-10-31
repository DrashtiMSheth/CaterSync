import React from "react";
import PropTypes from "prop-types";

export default function UpcomingEventsTable({ events, roleRates, onApplyClick, getAppForEvent, onCancel }) {
  const table = { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "10px", overflow: "hidden" };
  const thead = { background: "#212529", color: "#fff" };
  const th = { padding: "10px", textAlign: "left" };
  const td = { padding: "10px", borderBottom: "1px solid #ddd", color: "#000" };

  return (
    <table style={table}>
      <thead style={thead}>
        <tr>
          {["Event", "Start", "End", "Location", "Staff & Rates", "Your Application", "Action"].map((col) => (
            <th key={col} style={th}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(events || []).map((event, i) => {
          const app = getAppForEvent?.(event.id);
          return (
            <tr key={event.id} style={{ background: i % 2 ? "#fafafa" : "#fff" }}>
              <td style={td}>{event.name}</td>
              <td style={td}>{event.startDate} {event.startTime}</td>
              <td style={td}>{event.endDate} {event.endTime}</td>
              <td style={td}>{event.location}</td>
              <td style={td}>
                {Object.entries(event.staff).map(([role, count]) => (
                  <div key={role}>
                    <b>{role}</b> ({count}) — 💰 ${roleRates[role]?.rate} <small>({roleRates[role]?.type})</small>
                  </div>
                ))}
              </td>
              <td style={td}>
                {app ? (
                  <div>
                    ✅ Applied as <b>{app.role}</b>{" "}
                    {roleRates[app.role] && (
                      <>
                        <br />💵 <b>{roleRates[app.role].type === "per hour" ? `$${app.totalPay}` : `$${roleRates[app.role].rate}`}</b> ({roleRates[app.role].type})
                      </>
                    )}
                  </div>
                ) : (
                  <span style={{ color: "#999" }}>Not Applied</span>
                )}
              </td>
              <td style={td}>
                {!app ? (
                  <button onClick={() => onApplyClick?.(event)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#007bff", color: "#fff", cursor: "pointer" }}>Apply</button>
                ) : (
                  <button onClick={() => onCancel?.(event.id)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#dc3545", color: "#fff", cursor: "pointer" }}>Cancel</button>
                )}
              </td>
            </tr>
          );
        })}
        {(!events || events.length === 0) && (
          <tr>
            <td style={td} colSpan={7}>No upcoming events</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

UpcomingEventsTable.propTypes = {
  events: PropTypes.array,
  roleRates: PropTypes.object.isRequired,
  onApplyClick: PropTypes.func,
  getAppForEvent: PropTypes.func,
  onCancel: PropTypes.func,
};

