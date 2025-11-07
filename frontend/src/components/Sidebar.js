import React from "react";
import { NavLink } from "react-router-dom";
import "./all.css";

export default function Sidebar({ lastUpdated }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>AquaSight</h1>
        <p className="muted">Live drainage network</p>
      </div>

      <nav className="nav">
        <NavLink to="/" className="nav-link">
          🏠 Overview
        </NavLink>
        <NavLink to="/analytics" className="nav-link">
          📊 Analytics Dashboard
        </NavLink>
        <NavLink to="/prediction" className="nav-link">🧠 Prediction</NavLink>
        
      </nav>

      <div className="sidebar-footer">
        <small className="muted">Last updated</small>
        <div>{lastUpdated ? new Date(lastUpdated).toLocaleString() : "-"}</div>
      </div>
    </aside>
  );
}
