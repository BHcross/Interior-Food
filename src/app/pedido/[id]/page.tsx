import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";
import { OrderStatusLive } from "@/components/order-status-live";
import { ClearCartIfMatches } from "@/components/clear-cart-if-matches";
import { StoreMap } from "@/components/store-map";
import { DeliveryTrackingMap } from "@/components/delivery-tracking-map";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderWithMerchant = Order & {
  merchants: { name: string; latitude: number | null; longitude: number | null };
};

export default async function PedidoPage(props: PageProps<"/pedido/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, merchants(name, latitude, longitude)")
    .eq("id", id)
    .single<OrderWithMerchant>();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .returns<OrderItem[]>();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <ClearCartIfMatches merchantId={order.merchant_id} />

      <h1 className="mb-1 text-2xl font-semibold">Pedido em {order.merchants.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Pedido #{order.id.slice(0, 8)}</p>

      <OrderStatusLive orderId={order.id} initialStatus={order.status} />

      {order.courier_id && order.status === "out_for_delivery" ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Acompanhe o entregador
          </h2>
          <DeliveryTrackingMap
            courierId={order.courier_id}
            merchantLatitude={order.merchants.latitude}
            merchantLongitude={order.merchants.longitude}
            merchantName={order.merchants.name}
            deliveryLatitude={order.delivery_latitude}
            deliveryLongitude={order.delivery_longitude}
          />
        </div>
      ) : (
        order.merchants.latitude !== null &&
        order.merchants.longitude !== null && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Localização da loja
            </h2>
            <StoreMap
              latitude={order.merchants.latitude}
              longitude={order.merchants.longitude}
              label={order.merchants.name}
              height={180}
            />
          </div>
        )
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {(items ?? []).map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.product_name}
              </span>
              <span>R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span>Entrega</span>
            <span>R$ {order.delivery_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>R$ {order.total.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
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
        </CardContent>
      </Card>
    </div>
  );
}
