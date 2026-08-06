"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { createClient } from "@/lib/supabase/client";

interface Props {
  courierId: string;
  merchantLatitude: number | null;
  merchantLongitude: number | null;
  merchantName: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
}

export function DeliveryTrackingMap({
  courierId,
  merchantLatitude,
  merchantLongitude,
  merchantName,
  deliveryLatitude,
  deliveryLongitude,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [courierPosition, setCourierPosition] = useState<[number, number] | null>(null);

  // Monta o mapa uma vez, com os pinos fixos (loja e destino).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ default: leaflet }, { defaultMarkerIcon }] = await Promise.all([
        import("leaflet"),
        import("@/lib/leaflet-icon"),
      ]);
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = leaflet;

      const points: [number, number][] = [];
      if (merchantLatitude !== null && merchantLongitude !== null) {
        points.push([merchantLatitude, merchantLongitude]);
      }
      if (deliveryLatitude !== null && deliveryLongitude !== null) {
        points.push([deliveryLatitude, deliveryLongitude]);
      }

      const map = leaflet.map(containerRef.current).setView(points[0] ?? [-14.235, -51.9253], 14);
      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      if (merchantLatitude !== null && merchantLongitude !== null) {
        leaflet
          .marker([merchantLatitude, merchantLongitude], { icon: defaultMarkerIcon })
          .addTo(map)
          .bindPopup(merchantName);
      }
      if (deliveryLatitude !== null && deliveryLongitude !== null) {
        leaflet
          .marker([deliveryLatitude, deliveryLongitude], { icon: defaultMarkerIcon })
          .addTo(map)
          .bindPopup("Endereço de entrega");
      }

      if (points.length > 1) {
        map.fitBounds(points, { padding: [30, 30] });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca a posição atual do entregador e assina atualizações em tempo real.
  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("courier_locations")
      .select("latitude, longitude")
      .eq("courier_id", courierId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCourierPosition([data.latitude, data.longitude]);
      });

    const channel = supabase
      .channel(`courier-location-${courierId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courier_locations",
          filter: `courier_id=eq.${courierId}`,
        },
        (payload) => {
          const row = payload.new as { latitude: number; longitude: number } | null;
          if (row) setCourierPosition([row.latitude, row.longitude]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courierId]);

  // Atualiza (ou cria) o marcador do entregador quando a posição muda.
  useEffect(() => {
    if (!courierPosition || !mapRef.current || !leafletRef.current) return;
    const leaflet = leafletRef.current;

    if (!courierMarkerRef.current) {
      const bikeIcon = leaflet.divIcon({
        html: '<div style="background:var(--primary,#e2532d);width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.4);font-size:16px;">🛵</div>',
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      courierMarkerRef.current = leaflet
        .marker(courierPosition, { icon: bikeIcon })
        .addTo(mapRef.current)
        .bindPopup("Entregador");
    } else {
      courierMarkerRef.current.setLatLng(courierPosition);
    }

    mapRef.current.panTo(courierPosition);
  }, [courierPosition]);

  return (
    <div>
      <div ref={containerRef} style={{ height: 280 }} className="w-full overflow-hidden rounded-xl border" />
      {!courierPosition && (
        <p className="mt-2 text-sm text-muted-foreground">
          Aguardando o entregador compartilhar a localização...
        </p>
      )}
    </div>
  );
}
