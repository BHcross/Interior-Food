"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

export function StoreMap({
  latitude,
  longitude,
  label,
  height = 200,
}: {
  latitude: number;
  longitude: number;
  label: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ default: leaflet }, { defaultMarkerIcon }] = await Promise.all([
        import("leaflet"),
        import("@/lib/leaflet-icon"),
      ]);
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = leaflet
        .map(containerRef.current, { zoomControl: false, dragging: false, scrollWheelZoom: false })
        .setView([latitude, longitude], 15);
      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      leaflet.marker([latitude, longitude], { icon: defaultMarkerIcon }).addTo(map).bindPopup(label);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-xl border"
    />
  );
}
