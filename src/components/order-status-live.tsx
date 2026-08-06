"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function OrderStatusLive({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => setStatus(payload.new.status as OrderStatus),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const isCancelled = status === "cancelled";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <div className="flex flex-col gap-3">
      <Badge variant={isCancelled ? "destructive" : "default"} className="w-fit text-base">
        {ORDER_STATUS_LABELS[status]}
      </Badge>

      {!isCancelled && (
        <div className="flex items-center gap-1">
          {ORDER_STATUS_FLOW.map((step, i) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                i <= currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
