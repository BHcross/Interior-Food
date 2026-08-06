"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

export async function claimOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "É preciso entrar na sua conta." };

  const { error } = await supabase
    .from("orders")
    .update({ courier_id: user.id })
    .eq("id", orderId)
    .is("courier_id", null)
    .eq("status", "preparing");

  if (error) return { error: error.message };

  revalidatePath("/entregador");
  return {};
}

export async function updateCourierOrderStatus(
  orderId: string,
  status: "out_for_delivery" | "delivered",
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "É preciso entrar na sua conta." };

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("courier_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/entregador");
  return {};
}
