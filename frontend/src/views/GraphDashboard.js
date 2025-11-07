import React, { useMemo, useState, useEffect } from "react";
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "D:/water_logging/dashboard/frontend/src/components/all.css";
export default function GraphDashboard({ tanks = {} }) {
  const [filter, setFilter] = useState("ALL");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate status distribution
  const statusCounts = useMemo(() => {
    const counts = { GREEN: 0, YELLOW: 0, RED: 0 };
    const tankArray = Object.values(tanks);
    
    tankArray.forEach((t) => {
      const s = t?.status?.toUpperCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    
    const total = tankArray.length || 1;
    return {
      data: [
        { name: "Optimal", value: counts.GREEN, color: "#10b981" },
        { name: "Warning", value: counts.YELLOW, color: "#f59e0b" },
        { name: "Critical", value: counts.RED, color: "#ef4444" },
      ],
      percentages: {
        green: Math.round((counts.GREEN / total) * 100),
        yellow: Math.round((counts.YELLOW / total) * 100),
        red: Math.round((counts.RED / total) * 100),
      },
      counts,
      total: tankArray.length,
    };
  }, [tanks]);

  const filteredTanks = Object.entries(tanks).filter(
    ([, t]) => filter === "ALL" || t?.status?.toUpperCase() === filter
  );

  // Tank level distribution
  const levelDistribution = useMemo(() => {
    const ranges = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
    Object.values(tanks).forEach((t) => {
      const level = Number(t?.level) || 0;
      if (level <= 25) ranges["0-25"]++;
      else if (level <= 50) ranges["26-50"]++;
      else if (level <= 75) ranges["51-75"]++;
      else ranges["76-100"]++;
    });
    return [
      { range: "0-25%", count: ranges["0-25"], color: "#ef4444" },
      { range: "26-50%", count: ranges["26-50"], color: "#f59e0b" },
      { range: "51-75%", count: ranges["51-75"], color: "#fbbf24" },
      { range: "76-100%", count: ranges["76-100"], color: "#10b981" },
    ];
  }, [tanks]);

  // Radar chart data - show all tanks with their current levels
  const radarData = useMemo(() => {
    return filteredTanks.slice(0, 8).map(([name, t]) => ({
      tank: name.length > 10 ? name.substring(0, 8) + '..' : name,
      level: Number(t?.level) || 0,
      capacity: 100,
    }));
  }, [filteredTanks]);

  // Average level per status
  const avgByStatus = useMemo(() => {
    const stats = { GREEN: [], YELLOW: [], RED: [] };
    Object.values(tanks).forEach((t) => {
      const s = t?.status?.toUpperCase();
      const level = Number(t?.level) || 0;
      if (stats[s]) stats[s].push(level);
    });
    
    return [
      { 
        status: "Optimal", 
        avg: stats.GREEN.length ? stats.GREEN.reduce((a, b) => a + b, 0) / stats.GREEN.length : 0,
        count: stats.GREEN.length 
      },
      { 
        status: "Warning", 
        avg: stats.YELLOW.length ? stats.YELLOW.reduce((a, b) => a + b, 0) / stats.YELLOW.length : 0,
        count: stats.YELLOW.length 
      },
      { 
        status: "Critical", 
        avg: stats.RED.length ? stats.RED.reduce((a, b) => a + b, 0) / stats.RED.length : 0,
        count: stats.RED.length 
      },
    ];
  }, [tanks]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0];
    return (
      <div style={{
        background: "rgba(17, 24, 39, 0.95)",
        border: "1px solid rgba(96, 165, 250, 0.3)",
        padding: "12px 16px",
        borderRadius: "8px",
        backdropFilter: "blur(10px)",
      }}>
        <p style={{ color: "#e5e7eb", margin: 0, fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
          {label || data.payload.time || data.name}
        </p>
        <p style={{ color: data.color || "#60a5fa", margin: 0, fontSize: "14px", fontWeight: "700" }}>
          {data.dataKey === 'count' ? `${data.value} tanks` : `${Number(data.value).toFixed(1)}%`}
        </p>
      </div>
    );
  };

  const hasData = Object.keys(tanks).length > 0;

  if (!hasData) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: "32px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#60a5fa", marginBottom: "12px" }}>
            Waiting for Tank Data...
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "16px" }}>
            No tanks detected. Please check your backend connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      padding: "32px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#e5e7eb",
    }}>
      {/* Header */}
      <div style={{
        marginBottom: "40px",
        animation: mounted ? "fadeInDown 0.6s ease-out" : "none",
      }}>
        <h1 style={{
          fontSize: "42px",
          fontWeight: "800",
          background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "8px",
          letterSpacing: "-0.02em",
        }}>
          Analytics Dashboard
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "16px", marginTop: 0 }}>
          Real-time monitoring • {Object.keys(tanks).length} tanks tracked
        </p>

        {/* Filter Pills */}
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["ALL", "RED", "YELLOW", "GREEN"].map((f) => {
            const count = f === "ALL" ? Object.keys(tanks).length : statusCounts.counts[f] || 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  border: filter === f ? "2px solid #60a5fa" : "2px solid transparent",
                  background: filter === f 
                    ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: filter === f ? "#fff" : "#d1d5db",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  backdropFilter: "blur(10px)",
                  transform: filter === f ? "scale(1.05)" : "scale(1)",
                  boxShadow: filter === f ? "0 8px 25px rgba(59, 130, 246, 0.4)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (filter !== f) {
                    e.target.style.background = "rgba(255, 255, 255, 0.1)";
                    e.target.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== f) {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.transform = "scale(1)";
                  }
                }}
              >
                {f} <span style={{ opacity: 0.7, fontSize: "12px" }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "40px",
        animation: mounted ? "fadeInUp 0.6s ease-out 0.1s both" : "none",
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
          borderRadius: "20px",
          padding: "28px",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🟢</div>
          <div style={{ fontSize: "38px", fontWeight: "800", color: "#10b981", marginBottom: "4px" }}>
            {statusCounts.counts.GREEN}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "500" }}>
            Optimal Status ({statusCounts.percentages.green}%)
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)",
          borderRadius: "20px",
          padding: "28px",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🟡</div>
          <div style={{ fontSize: "38px", fontWeight: "800", color: "#f59e0b", marginBottom: "4px" }}>
            {statusCounts.counts.YELLOW}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "500" }}>
            Warning Status ({statusCounts.percentages.yellow}%)
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
          borderRadius: "20px",
          padding: "28px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🔴</div>
          <div style={{ fontSize: "38px", fontWeight: "800", color: "#ef4444", marginBottom: "4px" }}>
            {statusCounts.counts.RED}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "500" }}>
            Critical Status ({statusCounts.percentages.red}%)
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
        gap: "24px",
        marginBottom: "40px",
        animation: mounted ? "fadeInUp 0.6s ease-out 0.2s both" : "none",
      }}>
        {/* Status Distribution - Pie */}
        <div style={{
          background: "rgba(30, 41, 59, 0.5)",
          borderRadius: "24px",
          padding: "32px",
          border: "1px solid rgba(96, 165, 250, 0.2)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: "700", color: "#f3f4f6" }}>
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusCounts.data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                label={(entry) => entry.value > 0 ? entry.value : ''}
              >
                {statusCounts.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Level Distribution */}
        <div style={{
          background: "rgba(30, 41, 59, 0.5)",
          borderRadius: "24px",
          padding: "32px",
          border: "1px solid rgba(167, 139, 250, 0.2)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: "700", color: "#f3f4f6" }}>
            Level Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={levelDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} animationDuration={1000}>
                {levelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Level by Status */}
        <div style={{
          background: "rgba(30, 41, 59, 0.5)",
          borderRadius: "24px",
          padding: "32px",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: "700", color: "#f3f4f6" }}>
            Average Level by Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={avgByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="status" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" radius={[10, 10, 0, 0]} animationDuration={1000}>
                {avgByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : index === 1 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div style={{
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: "24px",
            padding: "32px",
            border: "1px solid rgba(96, 165, 250, 0.2)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: "700", color: "#f3f4f6" }}>
              Tank Capacity Overview
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                <PolarAngleAxis dataKey="tank" stroke="#9ca3af" fontSize={11} />
                <PolarRadiusAxis stroke="#9ca3af" domain={[0, 100]} />
                <Radar name="Level %" dataKey="level" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} animationDuration={1000} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Individual Tank Charts */}
      <h3 style={{ 
        fontSize: "24px", 
        fontWeight: "700", 
        color: "#f3f4f6", 
        marginBottom: "24px",
        animation: mounted ? "fadeInUp 0.6s ease-out 0.3s both" : "none",
      }}>
        Individual Tank History
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        gap: "24px",
        animation: mounted ? "fadeInUp 0.6s ease-out 0.4s both" : "none",
      }}>
        {filteredTanks.map(([name, t], idx) => {
          const history = t?.history || [];
          const chartData = history.slice(-15).map((p, i) => ({
            time: new Date(p.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            level: Number(p.level) || 0,
            index: i,
          }));

          const statusColor = t?.status === "RED" ? "#ef4444" : t?.status === "YELLOW" ? "#f59e0b" : "#10b981";
          const currentLevel = Number(t?.level) || 0;

          return (
            <div
              key={name}
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                borderRadius: "24px",
                padding: "24px",
                border: `1px solid ${statusColor}40`,
                backdropFilter: "blur(10px)",
                boxShadow: `0 20px 60px ${statusColor}20`,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: `radial-gradient(circle, ${statusColor}15 0%, transparent 70%)`, borderRadius: "50%" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#f3f4f6" }}>{name}</h4>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: statusColor, marginTop: "4px" }}>
                    {currentLevel.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 20px ${statusColor}`,
                  animation: t?.status === "RED" ? "pulse 2s infinite" : "none",
                }} />
              </div>

              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={statusColor} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={statusColor} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="level"
                      stroke={statusColor}
                      strokeWidth={2.5}
                      fill={`url(#gradient-${idx})`}
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  height: "160px", 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "#6b7280",
                  fontSize: "13px",
                  gap: "8px"
                }}>
                  <div style={{ fontSize: "32px" }}>📈</div>
                  <div>Collecting history data...</div>
                  <div style={{ fontSize: "11px", opacity: 0.7 }}>({history.length} data points)</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}