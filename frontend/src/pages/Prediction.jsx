import React, { useEffect, useState } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Droplets, AlertTriangle, TrendingUp, Cloud, Search, MapPin, Activity, Waves, ChevronRight, Zap } from "lucide-react";

const Prediction = () => {
  const [tankData, setTankData] = useState({});
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTanks, setFilteredTanks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const generateTrendData = (currentLevel, status) => {
    const data = [];
    const tankDepth = 30;
    const currentWaterHeight = tankDepth - currentLevel;

    for (let i = 11; i >= 0; i--) {
      const timeAgo = i * 5;
      let pastLevel = currentWaterHeight - i * 1.5;
      pastLevel = Math.max(0, Math.min(pastLevel, tankDepth));

      data.push({
        time: i === 0 ? "Now" : `-${timeAgo}m`,
        level: parseFloat(pastLevel.toFixed(1)),
        threshold: tankDepth * 0.8,
      });
    }
    return data;
  };

  const calculatePrediction = (tank, rainData) => {
    const { level, status } = tank;
    const rainIntensity = rainData?.rain || 0;

    if (level === 0 || level === undefined || level === null) return "No data received";

    const tankDepth = 30;
    const distance = Math.max(0, Math.min(level, tankDepth));
    const waterHeight = tankDepth - distance;

    let riseRate = 0.2;
    riseRate *= 1 + rainIntensity / 10;
    if (status === "RED") riseRate *= 1.5;
    else if (status === "GREEN") riseRate *= 0.8;

    const remainingGap = distance;
    const timeToOverflowSec = remainingGap / riseRate;
    const timeToOverflowMin = timeToOverflowSec / 60;

    if (timeToOverflowMin <= 0) return "Overflowing!";
    if (timeToOverflowMin < 60) return `~${timeToOverflowMin.toFixed(1)} min`;
    return `~${(timeToOverflowMin / 60).toFixed(1)} hr`;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredTanks([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        alert("Location not found. Please try another search.");
        setIsSearching(false);
        return;
      }

      const searchLat = parseFloat(geocodeData[0].lat);
      const searchLon = parseFloat(geocodeData[0].lon);

      const tanksResponse = await fetch("http://10.10.118.246:5000/get_tanks");
      const tanksData = await tanksResponse.json();

      const nearbyTanks = [];
      Object.keys(tanksData).forEach((tankKey) => {
        if (tankKey !== "weather") {
          const tank = tanksData[tankKey];
          if (tank.latitude && tank.longitude) {
            const distance = calculateDistance(searchLat, searchLon, tank.latitude, tank.longitude);
            if (distance <= 4) {
              nearbyTanks.push(tankKey);
            }
          }
        }
      });

      if (nearbyTanks.length === 0) {
        alert(`No drains found within 4km of ${geocodeData[0].display_name}`);
      }

      setFilteredTanks(nearbyTanks);
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Error searching location. Please try again.");
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://10.10.118.246:5000/get_tanks");
        const data = await response.json();
        setTankData(data);

        const newHistoricalData = {};
        Object.keys(data).forEach((tankKey) => {
          if (tankKey !== "weather" && data[tankKey].level) {
            newHistoricalData[tankKey] = generateTrendData(data[tankKey].level, data[tankKey].status);
          }
        });
        setHistoricalData(newHistoricalData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingText}>Loading AquaSight Data...</div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipTime}>{payload[0].payload.time}</p>
          <p style={styles.tooltipLevel}>Level: {payload[0].value} cm</p>
        </div>
      );
    }
    return null;
  };

  const displayTanks = isSearching && filteredTanks.length > 0 ? filteredTanks : Object.keys(tankData).filter((key) => key !== "weather");

  const totalTanks = Object.keys(tankData).filter((k) => k !== "weather").length;
  const criticalTanks = Object.keys(tankData).filter((k) => k !== "weather" && tankData[k].status === "RED").length;
  const warningTanks = Object.keys(tankData).filter((k) => k !== "weather" && tankData[k].status === "YELLOW").length;

  return (
    <div style={styles.mainContent}>
      {/* HEADER */}
      <div style={styles.headerSection}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.pageTitle}>Drainage System</h1>
            <p style={styles.pageSubtitle}>Real-time overflow prediction</p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.quickStat}>
              <span style={styles.quickStatLabel}>Active Drains</span>
              <span style={styles.quickStatValue}>{totalTanks}</span>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.quickStat}>
              <span style={styles.quickStatLabel}>Alerts</span>
              <span style={styles.quickStatValue} 
              style={{color: criticalTanks > 0 ? '#ef4444' : '#10b981'}}>{criticalTanks}</span>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div style={styles.searchBar}>
          <MapPin size={18} color="#06b6d4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Find drains by location..."
            style={styles.searchInputField}
          />
          <button onClick={handleSearch} style={styles.searchBtn}>
            <Search size={16} />
          </button>
        </div>

        {isSearching && filteredTanks.length > 0 && (
          <div style={styles.resultsBanner}>
            <span>{filteredTanks.length} drain(s) found within 4km</span>
            <button onClick={() => { setIsSearching(false); setFilteredTanks([]); setSearchQuery(""); }} style={styles.clearBtn}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* METRICS ROW */}
      <div style={styles.metricsRow}>
        <div style={styles.metricItem}>
          <div style={{...styles.metricIconBg, backgroundColor: "rgba(59, 130, 246, 0.15)"}}>
            <Waves size={20} color="#3b82f6" />
          </div>
          <div>
            <p style={styles.metricLabel}>Total Drains</p>
            <p style={styles.metricValue}>{totalTanks}</p>
          </div>
        </div>

        <div style={styles.metricItem}>
          <div style={{...styles.metricIconBg, backgroundColor: "rgba(245, 158, 11, 0.15)"}}>
            <AlertTriangle size={20} color="#f59e0b" />
          </div>
          <div>
            <p style={styles.metricLabel}>Warnings</p>
            <p style={styles.metricValue}>{warningTanks}</p>
          </div>
        </div>

        <div style={styles.metricItem}>
          <div style={{...styles.metricIconBg, backgroundColor: "rgba(239, 68, 68, 0.15)"}}>
            <Zap size={20} color="#ef4444" />
          </div>
          <div>
            <p style={styles.metricLabel}>Critical</p>
            <p style={styles.metricValue}>{criticalTanks}</p>
          </div>
        </div>
      </div>

      {/* TANKS LIST */}
      <div style={styles.tanksContainer}>
        {displayTanks.map((tankKey, index) => {
          const tank = tankData[tankKey];
          const rainData = tankData.weather || {};
          const prediction = calculatePrediction(tank, rainData);
          const trendData = historicalData[tankKey] || [];

          const tankDepth = 30;
          const waterHeight = tank.level ? tankDepth - tank.level : 0;
          const fillPercentage = (waterHeight / tankDepth) * 100;

          return (
            <div key={index} style={styles.tankRow}>
              {/* LEFT SECTION */}
              <div style={styles.tankLeft}>
                <div style={styles.tankIdentity}>
                  <h3 style={styles.tankName}>{tankKey}</h3>
                  <div style={{...styles.statusPill, ...statusColors[tank.status]}}>
                    {tank.status}
                  </div>
                </div>
                <p style={styles.tankCoords}>
                  <MapPin size={13} style={{marginRight: '4px'}} />
                  {tank.latitude?.toFixed(4)}, {tank.longitude?.toFixed(4)}
                </p>
              </div>

              {/* CENTER SECTION - DATA */}
              <div style={styles.tankMetrics}>
                <div style={styles.dataPoint}>
                  <span style={styles.dataLabel}>Level</span>
                  <span style={styles.dataNum}>{tank.level ? waterHeight.toFixed(1) : "N/A"}</span>
                  <span style={styles.dataUnit}>cm</span>
                </div>
                <div style={styles.dataPoint}>
                  <span style={styles.dataLabel}>Rain</span>
                  <span style={styles.dataNum}>{rainData.rain || "0"}</span>
                  <span style={styles.dataUnit}>mm/h</span>
                </div>
                <div style={styles.dataPoint}>
                  <span style={styles.dataLabel}>Capacity</span>
                  <span style={styles.dataNum}>{fillPercentage.toFixed(0)}</span>
                  <span style={styles.dataUnit}>%</span>
                </div>
              </div>

              {/* RIGHT SECTION - PREDICTION */}
              <div style={{...styles.predictionBox, ...getPredictionStyle(prediction)}}>
                <div style={styles.predLabel}>Overflow In</div>
                <div style={styles.predValue}>{prediction}</div>
              </div>

              {/* EXPANDED CONTENT */}
              <div style={styles.expandedContent}>
                {/* GRAPH */}
                <div style={styles.graphSection}>
                  <div style={styles.graphTitle}>
                    <Activity size={16} />
                    Trend
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id={`grad${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="time" stroke="#8b98af" style={{ fontSize: "11px" }} />
                      <YAxis stroke="#8b98af" style={{ fontSize: "11px" }} width={35} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="level"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill={`url(#grad${index})`}
                      />
                      <Line
                        type="monotone"
                        dataKey="threshold"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={styles.graphLegend}>
                    <div style={styles.legendItem}>
                      <div style={{...styles.legendDot, backgroundColor: "#06b6d4"}}></div>
                      <span>Current</span>
                    </div>
                    <div style={styles.legendItem}>
                      <div style={{...styles.legendDot, backgroundColor: "#ef4444"}}></div>
                      <span>Threshold (80%)</span>
                    </div>
                  </div>
                </div>

                {/* TANK VISUAL */}
                <div style={styles.visualSection}>
                  <div style={styles.tankBar}>
                    <div
                      style={{
                        ...styles.tankFill,
                        height: `${fillPercentage}%`,
                        backgroundColor:
                          fillPercentage > 80
                            ? "#ef4444"
                            : fillPercentage > 50
                            ? "#f59e0b"
                            : "#06b6d4",
                      }}
                    ></div>
                    <span style={styles.fillText}>{fillPercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getPredictionStyle = (prediction) => {
  if (prediction.includes("Overflowing")) {
    return { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" };
  } else if (prediction.includes("min")) {
    return { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.4)", color: "#fcd34d" };
  }
  return { backgroundColor: "rgba(6, 182, 212, 0.15)", borderColor: "rgba(6, 182, 212, 0.4)", color: "#22d3ee" };
};

const statusColors = {
  GREEN: { backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid #10b981" },
  YELLOW: { backgroundColor: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", border: "1px solid #f59e0b" },
  RED: { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444" },
};

const styles = {
  mainContent: {
    padding: "32px 40px",
    background: "linear-gradient(135deg, #0f172a 0%, #1a1f3a 50%, #0f172a 100%)",
    minHeight: "100vh",
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#f1f5f9",
  },

  headerSection: {
    marginBottom: "32px",
  },

  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    gap: "32px",
  },

  pageTitle: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "4px",
    letterSpacing: "-0.5px",
  },

  pageSubtitle: {
    color: "#a0aec0",
    fontSize: "0.95rem",
    fontWeight: "400",
  },

  headerStats: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },

  quickStat: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "120px",
  },

  quickStatLabel: {
    fontSize: "0.8rem",
    color: "#8b98af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  quickStatValue: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#06b6d4",
  },

  divider: {
    width: "1px",
    height: "50px",
    backgroundColor: "rgba(6, 182, 212, 0.2)",
  },

  searchBar: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(6, 182, 212, 0.3)",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "16px",
  },

  searchInputField: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  },

  searchBtn: {
    background: "rgba(6, 182, 212, 0.15)",
    border: "1px solid rgba(6, 182, 212, 0.4)",
    color: "#06b6d4",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
  },

  resultsBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(6, 182, 212, 0.1)",
    border: "1px solid rgba(6, 182, 212, 0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#06b6d4",
  },

  clearBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "4px 10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },

  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },

  metricItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(6, 182, 212, 0.15)",
    borderRadius: "10px",
    padding: "16px",
    transition: "all 0.3s ease",
  },

  metricIconBg: {
    width: "44px",
    height: "44px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  metricLabel: {
    fontSize: "0.8rem",
    color: "#8b98af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    margin: "0 0 4px 0",
  },

  metricValue: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#f1f5f9",
    margin: "0",
  },

  tanksContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  tankRow: {
    background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(30, 41, 59, 0.3) 100%)",
    border: "1px solid rgba(6, 182, 212, 0.15)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(8px)",
    transition: "all 0.3s ease",
  },

  tankLeft: {
    marginBottom: "16px",
  },

  tankIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },

  tankName: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#f1f5f9",
    margin: "0",
  },

  statusPill: {
    padding: "5px 12px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    border: "1px solid",
  },

  tankCoords: {
    display: "flex",
    alignItems: "center",
    color: "#8b98af",
    fontSize: "0.85rem",
    margin: "0",
  },

  tankMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },

  dataPoint: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "12px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    textAlign: "center",
  },

  dataLabel: {
    fontSize: "0.75rem",
    color: "#8b98af",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  dataNum: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#06b6d4",
  },

  dataUnit: {
    fontSize: "0.7rem",
    color: "#8b98af",
  },

  predictionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid",
    marginBottom: "16px",
  },

  predLabel: {
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    opacity: 0.8,
  },

  predValue: {
    fontSize: "1.15rem",
    fontWeight: "700",
  },

  expandedContent: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "16px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(6, 182, 212, 0.1)",
  },

  graphSection: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(6, 182, 212, 0.1)",
    borderRadius: "10px",
    padding: "14px",
  },

  graphTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#06b6d4",
    fontWeight: "600",
    fontSize: "0.85rem",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },

  graphLegend: {
    display: "flex",
    gap: "16px",
    marginTop: "10px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.75rem",
    color: "#8b98af",
  },

  legendDot: {
    width: "6px",
    height: "6px",
    borderRadius: "1px",
  },

  visualSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  tankBar: {
    position: "relative",
    width: "60px",
    height: "140px",
    background: "linear-gradient(180deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)",
    border: "2px solid rgba(6, 182, 212, 0.3)",
    borderRadius: "8px",
    overflow: "hidden",
  },

  tankFill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  fillText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "0.75rem",
    fontWeight: "800",
    color: "white",
    textShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
    zIndex: 10,
  },

  loadingContainer: {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },

  loadingContent: {
    textAlign: "center",
  },

  spinner: {
    width: "60px",
    height: "60px",
    border: "4px solid rgba(6, 182, 212, 0.2)",
    borderTop: "4px solid #06b6d4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },

  loadingText: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "white",
  },

  tooltip: {
    background: "#1e293b",
    border: "1px solid #06b6d4",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },

  tooltipTime: {
    color: "#06b6d4",
    fontWeight: "600",
    marginBottom: "4px",
    fontSize: "13px",
    margin: "0",
  },

  tooltipLevel: {
    color: "#cbd5e1",
    fontSize: "13px",
    margin: "0",
  },
};

export default Prediction;