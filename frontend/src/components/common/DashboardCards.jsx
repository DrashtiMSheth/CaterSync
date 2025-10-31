import React from "react";

export default function DashboardCards({ cards, active, onClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: "15px" }}>
      {cards.map((card) => (
        <div
          key={card.title}
          onClick={() => onClick?.(card.title)}
          style={{
            flex: 1,
            minWidth: "150px",
            padding: "20px",
            background: active === card.title ? "#10b981" : "#fff",
            borderRadius: 8,
            textAlign: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 120,
            color: active === card.title ? "#fff" : "#000",
            transition: "0.3s",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: "bold" }}>{card.value ?? card.count}</div>
          <div style={{ fontSize: 16, marginTop: 10 }}>{card.title}</div>
        </div>
      ))}
    </div>
  );
}

