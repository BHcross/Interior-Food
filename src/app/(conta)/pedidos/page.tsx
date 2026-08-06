import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS_LABELS, type Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function MeusPedidosPage() {
  const { user } = await getCurrentUser();
  if (!user) redirect("/entrar");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, merchants(name, slug)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .returns<(Order & { merchants: { name: string; slug: string } })[]>();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Meus pedidos</h1>
      <p className="mb-6 text-muted-foreground">Acompanhe seus pedidos e veja o histórico.</p>

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="size-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/pedido/${order.id}`}>
              <Card className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{order.merchants.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Pedido #{order.id.slice(0, 8)} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">R$ {order.total.toFixed(2)}</span>
                    <Badge variant={order.status === "cancelled" ? "destructive" : "secondary"}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
