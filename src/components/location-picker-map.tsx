"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

const DEFAULT_CENTER: [number, number] = [-14.235, -51.9253]; // centro aproximado do Brasil
const DEFAULT_ZOOM = 4;
const PIN_ZOOM = 16;

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = 260,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ default: leaflet }, { defaultMarkerIcon }] = await Promise.all([
        import("leaflet"),
        import("@/lib/leaflet-icon"),
      ]);
      if (cancelled || !containerRef.current || mapRef.current) return;

      const hasInitial = latitude !== null && longitude !== null;
      const map = leaflet.map(containerRef.current).setView(
        hasInitial ? [latitude!, longitude!] : DEFAULT_CENTER,
        hasInitial ? PIN_ZOOM : DEFAULT_ZOOM,
      );
      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      const marker = leaflet
        .marker(hasInitial ? [latitude!, longitude!] : DEFAULT_CENTER, {
          icon: defaultMarkerIcon,
          draggable: true,
        })
        .addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      // Se ainda não há localização definida, tenta centralizar no GPS do
      // dispositivo (ex: lojista abrindo o formulário de dentro da loja).
      if (!hasInitial && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (cancelled || !mapRef.current) return;
          const { latitude: lat, longitude: lng } = pos.coords;
          mapRef.current.setView([lat, lng], PIN_ZOOM);
          marker.setLatLng([lat, lng]);
          onChangeRef.current(lat, lng);
        });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflete atualizações externas de lat/lng (ex: escolha via busca de endereço).
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (latitude === null || longitude === null) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], PIN_ZOOM);
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-xl border"
    />
  );
}
