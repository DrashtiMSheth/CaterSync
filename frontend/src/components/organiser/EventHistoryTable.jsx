import React, { useMemo } from "react";
import PropTypes from "prop-types";

export default function EventHistoryTable({ events }) {
  const th = { padding: "12px", border: "1px solid #ccc", background: "#f3f4f6", fontWeight: "bold", cursor: "pointer" };
  const td = { padding: "12px", border: "1px solid #ccc", verticalAlign: "top" };
  const [sortConfig, setSortConfig] = React.useState({ key: "startDateTime", direction: "asc" });
  const [search, setSearch] = React.useState("");

  const format = (dt) => (dt ? String(dt).replace("T", " ") : "-");

  const sorted = useMemo(() => {
    const list = [...(events || [])];
    const { key, direction } = sortConfig;
    return list.sort((a, b) => {
      let valA = a[key] || a[key.replace("Time", "")] || "";
      let valB = b[key] || b[key.replace("Time", "")] || "";
      if (String(key).toLowerCase().includes("date")) {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [events, sortConfig]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sorted.filter((e) =>
      (e.name || e.eventName || "").toLowerCase().includes(q) ||
      (e.location || "").toLowerCase().includes(q) ||
      format(e.startDateTime || e.startDate).toLowerCase().includes(q) ||
      format(e.endDateTime || e.endDate).toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const setSort = (key) => setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));

  const calcBudget = (data) =>
    data?.paymentPerEvent ? data.paymentPerEvent : (Number(data?.male || 0) + Number(data?.female || 0)) * (Number(data?.hoursWorked || 0) * Number(data?.paymentPerHour || 0));

  const isAllPaid = (event) => {
    const staff = event.staff || {};
    const staffPaid = Object.values(staff).every((s) => s?.paid);
    return staffPaid && Boolean(event.extraPaid);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name, staff role, or date..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "8px", width: "300px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={th} onClick={() => setSort("name")}>Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
              <th style={th} onClick={() => setSort("startDateTime")}>Start {sortConfig.key === "startDateTime" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
              <th style={th} onClick={() => setSort("endDateTime")}>End {sortConfig.key === "endDateTime" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}</th>
              <th style={th}>Location</th>
              <th style={th}>Staff & Budget</th>
              <th style={th}>Extra Expenses</th>
              <th style={th}>Status</th>
              <th style={th}>All Payments Made</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((event) => (
                <tr key={event._id || event.id || event.name}>
                  <td style={td}>{event.name || event.eventName}</td>
                  <td style={td}>{format(event.startDateTime || event.startDate)}</td>
                  <td style={td}>{format(event.endDateTime || event.endDate)}</td>
                  <td style={td}>{event.location || "—"}</td>
                  <td style={td}>
                    {Object.entries(event.staff || {}).map(([role, data]) => (
                      <div key={role}>
                        {role}: {(Number(data?.male || 0) + Number(data?.female || 0))} ({calcBudget(data)}$) {data?.paid ? "✅" : "❌"}
                      </div>
                    ))}
                  </td>
                  <td style={td}>{event.extraExpenses > 0 ? `${event.extraExpenses}$ ${event.extraPaid ? "✅" : "❌"}` : "-"}</td>
                  <td style={td}>{event.status || "Completed"}</td>
                  <td style={td}>{isAllPaid(event) ? "✅ Paid" : "❌ Pending"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={td} colSpan={8}>No events found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

EventHistoryTable.propTypes = {
  events: PropTypes.array,
};

