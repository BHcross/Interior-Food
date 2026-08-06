"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, NavigationOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

// Compartilha a localização do entregador enquanto ele tiver pelo menos uma
// entrega "Saiu para entrega". Só funciona com esta aba aberta no celular
// (sem app nativo nesta fase).
export function LocationSharing({ active }: { active: boolean }) {
  const [status, setStatus] = useState<"idle" | "sharing" | "error">("idle");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      queueMicrotask(() => setStatus("error"));
      return;
    }

    const supabase = createClient();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setStatus("sharing");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("courier_locations").upsert({
          courier_id: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        });
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <Badge variant={status === "sharing" ? "default" : "secondary"} className="gap-1">
      {status === "sharing" ? <Navigation className="size-3" /> : <NavigationOff className="size-3" />}
      {status === "sharing" && "Compartilhando localização"}
      {status === "idle" && "Ativando localização..."}
      {status === "error" && "Não foi possível acessar sua localização"}
    </Badge>
  );
}
