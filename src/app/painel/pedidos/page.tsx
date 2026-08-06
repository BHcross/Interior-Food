import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Order, OrderItem } from "@/lib/types";
import { OrdersBoard } from "@/components/orders-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PedidosPage() {
  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("profile_id", user!.id)
    .maybeSingle();

  if (!merchant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cadastre sua loja primeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/painel/loja" />} nativeButton={false}>Cadastrar loja</Button>
        </CardContent>
      </Card>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .returns<(Order & { order_items: OrderItem[] })[]>();

  return <OrdersBoard merchantId={merchant.id} initialOrders={orders ?? []} />;
}
