"use server";

import { createClient } from "@/lib/supabase/server";
import type { ChatChannel } from "@/lib/types";

export interface SendMessageInput {
  orderId: string;
  channel: ChatChannel;
  body: string;
}

export interface ActionResult {
  error?: string;
}

export async function sendMessage(input: SendMessageInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "É preciso entrar na sua conta." };
  if (!input.body.trim()) return { error: "Digite uma mensagem." };

  const { error } = await supabase.from("order_messages").insert({
    order_id: input.orderId,
    channel: input.channel,
    sender_id: user.id,
    body: input.body.trim(),
  });

  if (error) return { error: error.message };
  return {};
}
