"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions/orders";
import { OrderChat } from "@/components/order-chat";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type OrderWithItems = Order & { order_items: OrderItem[] };

function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUS_FLOW.indexOf(status);
  if (i === -1 || i === ORDER_STATUS_FLOW.length - 1) return null;
  const next = ORDER_STATUS_FLOW[i + 1];
  // A loja não marca como "entregue" diretamente — só o entregador (com
  // o código) ou o próprio cliente confirmam o recebimento.
  if (next === "delivered") return null;
  return next;
}

export function OrdersBoard({
  merchantId,
  initialOrders,
}: {
  merchantId: string;
  initialOrders: OrderWithItems[];
}) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`merchant-orders-${merchantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", payload.new.id)
            .returns<OrderItem[]>();
          setOrders((prev) => [
            { ...(payload.new as Order), order_items: data ?? [] },
            ...prev,
          ]);
          toast.info("Novo pedido recebido!");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...(payload.new as Order) } : o,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantId]);

  async function handleAdvance(order: OrderWithItems) {
    const next = nextStatus(order.status);
    if (!next) return;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    const { error } = await updateOrderStatus(order.id, next);
    if (error) toast.error("Não foi possível atualizar o pedido.");
  }

  async function handleCancel(order: OrderWithItems) {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)),
    );
    const { error } = await updateOrderStatus(order.id, "cancelled");
    if (error) toast.error("Não foi possível cancelar o pedido.");
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">Nenhum pedido recebido ainda.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => {
        const next = nextStatus(order.status);
        const isFinal = order.status === "delivered" || order.status === "cancelled";

        return (
          <Card key={order.id} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Pedido #{order.id.slice(0, 8)}
              </CardTitle>
              <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span>R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
              <p>
                <span className="text-muted-foreground">Endereço: </span>
                {order.delivery_address}
              </p>
              <p>
                <span className="text-muted-foreground">Pagamento: </span>
                {order.payment_method === "pix" ? "Pix" : "Dinheiro"} na entrega
              </p>
              {order.notes && (
                <p>
                  <span className="text-muted-foreground">Observações: </span>
                  {order.notes}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <OrderChat orderId={order.id} channel="customer_merchant" title="cliente" />
                {order.courier_id && (
                  <OrderChat orderId={order.id} channel="merchant_courier" title="entregador" />
                )}
              </div>

              {order.status === "out_for_delivery" && (
                <p className="text-sm text-muted-foreground">
                  Aguardando confirmação da entrega pelo entregador ou pelo cliente.
                </p>
              )}

              {!isFinal && (
                <div className="mt-2 flex gap-2">
                  {next && (
                    <Button size="sm" onClick={() => handleAdvance(order)}>
                      Marcar como &quot;{ORDER_STATUS_LABELS[next]}&quot;
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleCancel(order)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
