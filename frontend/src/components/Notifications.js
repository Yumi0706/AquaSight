import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./all.css";

/**
 * Notifications builds alerts from tanks: one alert per tank/status
 * Shows only non-GREEN statuses by default. Dedupe by id = `${tank}|${status}`
 */
export default function Notifications({ tanks = {} }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    // Build map of current alerts (only non-GREEN)
    const entries = Object.entries(tanks || {});
    const incoming = entries
      .map(([name, t]) => {
        const status = (t && t.status ? String(t.status).toUpperCase() : "GREEN");
        return {
          id: `${name}|${status}`,
          name,
          status,
          level: t && t.level,
          ts: Date.now(),
          title: `${name} — ${status}`,
          message: `Level: ${t && (t.level ?? "N/A")}`,
        };
      })
      .filter((x) => x.status !== "GREEN");
      

    // Merge with previous to preserve dismissals
    const map = new Map();
    notifs.forEach((n) => map.set(n.id, n));
    incoming.forEach((n) => map.set(n.id, { ...map.get(n.id), ...n }));

    const merged = Array.from(map.values()).sort((a, b) => b.ts - a.ts);
    setNotifs(merged);
  }, [tanks]);

  useEffect(() => {
    // auto-expire notifications after 45s
    const timers = notifs.map((n) =>
      setTimeout(() => {
        setNotifs((prev) => prev.filter((x) => x.id !== n.id));
      }, 45_000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifs]);

  const dismiss = (id) => setNotifs((p) => p.filter((x) => x.id !== id));

  return (
    <div className="notifications-panel">
      <h3 className="panel-title">📢 Live Alerts</h3>
      <div className="notifications-list">
        <AnimatePresence initial={false}>
          {notifs.length === 0 && <div className="empty-state muted">No active alerts — all good ✅</div>}
          {notifs.map((n) => (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`notification-item ${n.status.toLowerCase()}`}
            >
              <div className="notification-top">
                <div>
                  <div className="notification-title"><strong>{n.title}</strong></div>
                  <div className="muted">{n.name}</div>
                </div>
                <div>
                  <button className="dismiss-btn" onClick={() => dismiss(n.id)}>✕</button>
                </div>
              </div>
              <div className="notification-body">{n.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
