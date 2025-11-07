import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";

import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Analytics from "./pages/Analytics";
import Prediction from "./pages/Prediction";
import "D:/water_logging/dashboard/frontend/src/components/all.css";


function App() {
  const [tanks, setTanks] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // --- Fetch & track status history ---
  const fetchTanks = async () => {
    try {
      const res = await axios.get("http://10.10.118.246:5000/get_tanks");
      const data = res.data || {};

      setTanks((prev) => {
        const updated = { ...prev };

        for (const [name, newTank] of Object.entries(data)) {
          const oldTank = prev[name] || {};
          // initialize structure
          if (!updated[name]) updated[name] = { ...newTank, history: [] };
          if (!updated[name].history) updated[name].history = [];

          // detect change
          const statusChanged = newTank.status !== oldTank.status;
          const levelChanged = newTank.level !== oldTank.level;

          if (statusChanged || levelChanged) {
            updated[name].history.push({
              ts: Date.now(),
              status: newTank.status,
              level: newTank.level,
            });
          }

          // always update latest info
          updated[name] = { ...updated[name], ...newTank };
        }
        return updated;
      });

      setLastUpdated(Date.now());
    } catch (err) {
      console.error("Failed to fetch tanks", err);
    }
  };

  useEffect(() => {
    fetchTanks();
    const id = setInterval(fetchTanks, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app-root">
      <Sidebar lastUpdated={lastUpdated} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview tanks={tanks} />} />
          <Route path="/analytics" element={<Analytics tanks={tanks} />} />
          <Route path="/prediction" element={<Prediction tanks={tanks} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
