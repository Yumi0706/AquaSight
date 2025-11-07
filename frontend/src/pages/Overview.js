import React, { useMemo, useState } from "react";
import HighlightsPanel from "../components/HighlightsPanel";
import MapView from "../components/MapView";
import Notifications from "../components/Notifications";
import SummaryCards from "../components/SummaryCards"; // keep your existing SummaryCards if present
import "D:/water_logging/dashboard/frontend/src/components/all.css";

export default function Overview({ tanks }) {
  // notifications state internal to Notifications component; pass tanks to it
  return (
    <div className="overview-grid">
      <header className="overview-header">
        <div>
          <h2>🌊 Overview & live alerts</h2>
          <p className="muted">Live system status</p>
        </div>
      </header>

      <section className="top-row">
        <HighlightsPanel tanks={tanks} />
        <SummaryCards tanks={tanks} />
      </section>

      <section className="mid-row">
        <div className="map-wrap">
          <MapView tanks={tanks} />
        </div>

        <aside className="alerts-wrap">
          <Notifications tanks={tanks} />
        </aside>
      </section>
    </div>
  );
}
