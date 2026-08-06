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
  status: "out_for_delivery",
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

// Marcar como entregue exige o código que só o cliente vê — evita que o
// entregador confirme a entrega sem ter entregado de verdade.
export async function confirmDeliveryWithCode(
  orderId: string,
  code: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "É preciso entrar na sua conta." };
  if (!/^\d{4}$/.test(code)) return { error: "Informe os 4 dígitos do código." };

  const { data, error } = await supabase.rpc("confirm_delivery_with_code", {
    p_order_id: orderId,
    p_code: code,
  });

  if (error) return { error: error.message };
  if (!data) return { error: "Código incorreto. Confirme com o cliente." };

  revalidatePath("/entregador");
  return {};
}
