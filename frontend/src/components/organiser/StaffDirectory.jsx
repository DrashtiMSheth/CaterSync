import React from "react";

export default function StaffDirectory({ staffList, onSelect }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Staff Name</th>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Email</th>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>Contact</th>
          <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #ccc" }}>View</th>
        </tr>
      </thead>
      <tbody>
        {staffList.map(staff => (
          <tr key={`staff-row-${staff.staffId}`} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: 10 }}>{staff.staffName}</td>
            <td style={{ padding: 10 }}>{staff.staffEmail}</td>
            <td style={{ padding: 10 }}>{staff.staffContact}</td>
            <td style={{ padding: 10 }}>
              <button onClick={() => onSelect(staff.staffId)} style={{ padding: "6px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

