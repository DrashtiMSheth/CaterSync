import React from "react";

export default function ProgressBar({ assigned = 0, required = 0 }) {
  const percentage = required ? Math.min((assigned / required) * 100, 100) : 0;
  let color = "#ef4444";
  if (percentage === 100) color = "#16a34a";
  else if (percentage > 0) color = "#facc15";

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 12 }}>{assigned}/{required}</div>
      <div style={{ background: "#e5e7eb", borderRadius: 6, height: 12, width: "100%" }}>
        <div style={{ width: `${percentage}%`, background: color, height: "100%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

