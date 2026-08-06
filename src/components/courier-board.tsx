"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  claimOrder,
  confirmDeliveryWithCode,
  updateCourierOrderStatus,
} from "@/lib/actions/courier";
import type { Order } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LocationSharing } from "@/components/location-sharing";
import { OrderChat } from "@/components/order-chat";

type OrderWithMerchant = Order & { merchants: { name: string; address: string | null } };

export function CourierBoard({
  courierId,
  initialAvailable,
  initialMine,
}: {
  courierId: string;
  initialAvailable: OrderWithMerchant[];
  initialMine: OrderWithMerchant[];
}) {
  const [available, setAvailable] = useState(initialAvailable);
  const [mine, setMine] = useState(initialMine);

  async function refetch() {
    const supabase = createClient();
    const [{ data: newAvailable }, { data: newMine }] = await Promise.all([
      supabase
        .from("orders")
        .select("*, merchants(name, address)")
        .is("courier_id", null)
        .eq("status", "preparing")
        .order("created_at")
        .returns<OrderWithMerchant[]>(),
      supabase
        .from("orders")
        .select("*, merchants(name, address)")
        .eq("courier_id", courierId)
        .in("status", ["preparing", "out_for_delivery"])
        .order("created_at")
        .returns<OrderWithMerchant[]>(),
    ]);
    setAvailable(newAvailable ?? []);
    setMine(newMine ?? []);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("courier-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClaim(orderId: string) {
    const result = await claimOrder(orderId);
    if (result.error) {
      toast.error("Não foi possível aceitar essa entrega.");
      return;
    }
    toast.success("Entrega aceita!");
    refetch();
  }

  async function handleAdvance(orderId: string) {
    const result = await updateCourierOrderStatus(orderId, "out_for_delivery");
    if (result.error) {
      toast.error("Não foi possível atualizar a entrega.");
      return;
    }
    refetch();
  }

  async function handleConfirmDelivery(orderId: string, code: string) {
    const result = await confirmDeliveryWithCode(orderId, code);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    toast.success("Entrega confirmada!");
    refetch();
    return true;
  }

  const hasActiveDelivery = mine.some((o) => o.status === "out_for_delivery");

  return (
    <div className="flex flex-col gap-8">
      <LocationSharing active={hasActiveDelivery} />

      <section>
        <h2 className="mb-3 text-lg font-medium">Minhas entregas</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não aceitou nenhuma entrega.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {mine.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Store className="size-4 text-primary" />
                      {order.merchants.name}
                    </span>
                    <Badge variant="secondary">
                      {order.status === "preparing" ? "Retirar na loja" : "Em rota"}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {order.delivery_address}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <OrderChat orderId={order.id} channel="merchant_courier" title="loja" />
                    <OrderChat orderId={order.id} channel="customer_courier" title="cliente" />
                  </div>
                  {order.status === "preparing" ? (
                    <Button size="sm" onClick={() => handleAdvance(order.id)}>
                      Saí para entrega
                    </Button>
                  ) : (
                    <DeliveryCodeForm
                      onConfirm={(code) => handleConfirmDelivery(order.id, code)}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Entregas disponíveis</h2>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrega disponível agora.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {available.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Store className="size-4 text-primary" />
                      {order.merchants.name}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {order.delivery_address}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleClaim(order.id)}>
                    Aceitar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DeliveryCodeForm({ onConfirm }: { onConfirm: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onConfirm(code);
    setSubmitting(false);
    if (ok) setCode("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="Código de 4 dígitos"
        inputMode="numeric"
        maxLength={4}
        className="w-40"
        required
      />
      <Button type="submit" size="sm" disabled={submitting || code.length !== 4}>
        Confirmar entrega
      </Button>
    </form>
  );
}
