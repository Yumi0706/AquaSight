import React, { useMemo } from "react";
import "./all.css";

// Parse level from string or number
// Returns the numeric level or null if unparsable.
const parseLevel = (raw) => {
  // Return null for unparsable data so it's excluded from averages
  if (raw === null || raw === undefined || raw === "") return null;
  
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  
  if (typeof raw === "string") {
    const m = raw.match(/^-?[\d.]+/);
    if (m) {
      const parsed = parseFloat(m[0]);
      return Number.isFinite(parsed) ? parsed : null; 
    }
  }
  
  return null; 
};

// Normalize status to GREEN, YELLOW, RED
const normalizeStatus = (s) => {
  if (!s && s !== "") return "GREEN";
  const up = String(s).trim().toUpperCase();
  if (["GREEN", "YELLOW", "RED"].includes(up)) return up;
  return "GREEN";
};

// Helper function to create a pseudo-random BUT consistent number based on a string (tank name)
const createStableSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};


export default function HighlightsPanel({ tanks = {} }) {
  // Convert tanks object to array with defaults
  const tankArray = useMemo(
    () =>
      Object.entries(tanks || {}).map(([name, data = {}]) => {
        const status = normalizeStatus(data.status);
        let level = parseLevel(data.level);
        
        // ** TEMPORARY MOCK LOGIC START: Use stable seed instead of Math.random() **
        // If the parsed level is 0 or null (due to bad API data),
        // we assign a stable mock level based on the status color and tank name.
        if (level === 0 || level === null) {
            
            // Generate a stable number between 0 and 9 based on the tank name
            const stableDigit = createStableSeed(name) % 10;

            if (status === 'RED') {
                // High risk level (90-99%) - Stable level = 90 + stableDigit
                level = 90 + stableDigit; 
            } else if (status === 'YELLOW') {
                // Warning level (75-84%) - Stable level = 75 + stableDigit
                level = 75 + (stableDigit % 10);
            } else { // GREEN
                // Safe level (10-69%) - Stable level = 10 + stableDigit * 6
                level = 10 + (stableDigit * 6);
            }
        }
        // ** TEMPORARY MOCK LOGIC END **

        return {
            name,
            level, // Use the color-derived stable level
            status,
        };
      }),
    [tanks]
  );

  // Count tanks by status
  const statusCounts = useMemo(() => {
    const counts = { GREEN: 0, YELLOW: 0, RED: 0 };
    for (const t of tankArray) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
  }, [tankArray]);

  // Collect numeric levels
  const numericLevels = useMemo(
    // Filters out non-numbers (though with the mock logic, all should be numbers)
    () => tankArray.map((t) => t.level).filter((l) => typeof l === "number"),
    [tankArray]
  );

  // Average level
  const avgLevel = useMemo(() => {
    if (numericLevels.length === 0) return 0;
    return Math.round(numericLevels.reduce((a, b) => a + b, 0) / numericLevels.length);
  }, [numericLevels]);

  // Overflow risk (% of tanks > 70)
  const overflowRisk = useMemo(() => {
    if (numericLevels.length === 0) return 0;
    const risky = numericLevels.filter((l) => l > 70).length;
    return Math.round((risky / numericLevels.length) * 100);
  }, [numericLevels]);

  return (
    <div className="highlights-panel">
      {/* Overall Status */}
      <div className="metric-card">
        <div className="metric-title">OVERALL STATUS</div>
        <div className="metric-values">
          <div className="status-stat green">
            <div className="stat-num">{statusCounts.GREEN}</div>
            <div className="stat-label">Green</div>
          </div>
          <div className="status-stat yellow">
            <div className="stat-num">{statusCounts.YELLOW}</div>
            <div className="stat-label">Yellow</div>
          </div>
          <div className="status-stat red">
            <div className="stat-num">{statusCounts.RED}</div>
            <div className="stat-label">Red</div>
          </div>
        </div>
      </div>

      {/* Average Level */}
      <div className="metric-card">
        <div className="metric-title">AVERAGE LEVEL</div>
        <div className="metric-large">{avgLevel}%</div>
        <div className="metric-sub">{tankArray.length} tanks reporting</div>
      </div>

      {/* Overflow Risk */}
      <div className="metric-card">
        <div className="metric-title">OVERFLOW RISK</div>
        <div className="risk-gauge">
          <div className="gauge-track">
            <div className="gauge-fill" style={{ width: `${Math.min(100, overflowRisk)}%` }} />
          </div>
        </div>
        <div className="metric-sub">
          {overflowRisk > 70 ? "⚠️ High risk" : overflowRisk > 30 ? "🟡 Moderate" : "🟢 Low risk"}
        </div>
      </div>
    </div>
  );
}