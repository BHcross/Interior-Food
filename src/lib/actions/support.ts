"use server";

import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

export async function sendSupportMessage(body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "É preciso entrar na sua conta." };
  if (!body.trim()) return { error: "Digite uma mensagem." };

  const { error } = await supabase.from("support_messages").insert({
    user_id: user.id,
    sender_id: user.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  return {};
}
