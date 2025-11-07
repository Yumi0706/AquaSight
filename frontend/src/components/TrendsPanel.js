import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./all.css";

/**
 * TrendsPanel expects a `tanks` object where each tank might contain a `history` array like:
 * tanks = { tank1: { history: [{ ts: 163..., level: 50 }, ...], ... }, ... }
 * If you don't have historic data yet, the component will fallback to build a small dataset from current values.
 */
const TrendsPanel = ({ tanks = {} }) => {
  // Build a combined dataset showing average level across time if history exists
  const hasHistory = Object.values(tanks).some((t) => Array.isArray(t.history) && t.history.length > 0);

  let data = [];
  if (hasHistory) {
    // assume histories are aligned by timestamp or use the largest union of timestamps
    const timestamps = new Set();
    Object.values(tanks).forEach((t) => (t.history || []).forEach((h) => timestamps.add(h.ts)));
    const tsArr = Array.from(timestamps).sort();
    data = tsArr.map((ts) => {
      const entry = { ts };
      let sum = 0, count = 0;
      Object.values(tanks).forEach((t) => {
        const h = (t.history || []).find((x) => x.ts === ts);
        if (h && typeof h.level === "number") {
          sum += h.level;
          count += 1;
        }
      });
      entry.avg = count ? Math.round(sum / count) : null;
      entry.label = new Date(ts).toLocaleTimeString();
      return entry;
    });
  } else {
    // fallback: snapshot of tanks (last-known levels)
    data = Object.entries(tanks).map(([k, v]) => ({
      label: k,
      avg: v.level ?? null,
    }));
  }

  return (
    <div className="trends-panel">
      <h4>Trends</h4>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <XAxis dataKey="label" tick={{ fill: "#bfc4d6" }} />
            <YAxis tick={{ fill: "#bfc4d6" }} />
            <Tooltip />
            <Line type="monotone" dataKey="avg" stroke="#7dd3fc" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendsPanel;
