import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Order } from "@/lib/types";
import { CourierBoard } from "@/components/courier-board";

type OrderWithMerchant = Order & { merchants: { name: string; address: string | null } };

export default async function EntregadorPage() {
  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: available }, { data: mine }] = await Promise.all([
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
      .eq("courier_id", user!.id)
      .in("status", ["preparing", "out_for_delivery"])
      .order("created_at")
      .returns<OrderWithMerchant[]>(),
  ]);

  return (
    <CourierBoard
      courierId={user!.id}
      initialAvailable={available ?? []}
      initialMine={mine ?? []}
    />
  );
}
