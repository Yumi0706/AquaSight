import React from "react";
import "./all.css";

export default function SummaryCards({ tanks = {} }) {
  const total = Object.keys(tanks).length;

  const activeAlerts = Object.values(tanks).filter(
    t => {
      const status = (t.status || "GREEN").toUpperCase();
      return status === "YELLOW" || status === "RED";
    }
  ).length;

  return (
    <div className="summary-cards">
      <div className="card">
        <h3>Total Tanks</h3>
        <p>{total}</p>
      </div>
      <div className="card">
        <h3>Active Alerts</h3>
        <p>{activeAlerts}</p>
      </div>
    </div>
  );
}
