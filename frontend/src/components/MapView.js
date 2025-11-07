import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "./all.css";

/**
 * MapView expects tanks as an object:
 * { TankA: { lat, lng, level, status }, ... }
 *
 * It creates the map once and updates markers in-place for smooth updates.
 */
const statusColor = (s) => {
  const S = (s || "").toUpperCase();
  if (S === "RED") return "#e63946";
  if (S === "YELLOW") return "#ffb703";
  if (S === "GREEN") return "#1dfb00ff";
  return "#6b7280";
};

export default function MapView({ tanks = {} }) {
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map-root", {
        center: [22.57, 88.36],
        zoom: 12,
        preferCanvas: true,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const seen = new Set();

    Object.entries(tanks || {}).forEach(([id, t]) => {
      if (!t || t.lat === undefined || t.lng === undefined) return;
      seen.add(id);
      const color = statusColor(t.status);

      if (existing[id]) {
        existing[id].setLatLng([t.lat, t.lng]);
        existing[id].setStyle({ fillColor: color, color });
        existing[id].setPopupContent(`<b>${id}</b><br/>Status: ${t.status}<br/>Level: ${t.level ?? "N/A"}`);
      } else {
        const marker = L.circleMarker([t.lat, t.lng], {
          radius: 9,
          fillColor: color,
          color,
          weight: 1,
          fillOpacity: 0.95,
        }).addTo(map);

        marker.bindPopup(`<b>${id}</b><br/>Status: ${t.status}<br/>Level: ${t.level ?? "N/A"}`);
        // optional pulsing via CSS class
        if (t.status && t.status.toUpperCase() === "RED") {
          marker.getElement()?.classList?.add("marker-red");
        }
        existing[id] = marker;
      }
    });

    // remove markers not present anymore
    Object.keys(existing).forEach((k) => {
      if (!seen.has(k)) {
        map.removeLayer(existing[k]);
        delete existing[k];
      }
    });
  }, [tanks]);

  return <div id="map-root" className="map-container" />;
}
