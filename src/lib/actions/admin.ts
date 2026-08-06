"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export interface DeleteAccountResult {
  error?: string;
  result?: "deleted" | "banned";
}

async function isCallerAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

export async function deleteAccount(
  profileId: string,
  role: Role,
): Promise<DeleteAccountResult> {
  if (!(await isCallerAdmin())) {
    return { error: "Apenas administradores podem fazer isso." };
  }

  const admin = createAdminClient();

  let merchantId: string | null = null;
  if (role === "merchant") {
    const { data: merchant } = await admin
      .from("merchants")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();
    merchantId = merchant?.id ?? null;
  }

  const orderFilter =
    role === "customer"
      ? { column: "customer_id", value: profileId }
      : role === "courier"
        ? { column: "courier_id", value: profileId }
        : { column: "merchant_id", value: merchantId };

  const [{ count: orderCount }, { count: messageCount }] = await Promise.all([
    orderFilter.value
      ? admin
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq(orderFilter.column, orderFilter.value)
      : Promise.resolve({ count: 0 }),
    admin
      .from("order_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", profileId),
  ]);

  const hasHistory = (orderCount ?? 0) > 0 || (messageCount ?? 0) > 0;

  if (hasHistory) {
    const { error: banError } = await admin.auth.admin.updateUserById(profileId, {
      ban_duration: "876000h",
    });
    if (banError) return { error: banError.message };

    await admin.from("profiles").update({ banned_at: new Date().toISOString() }).eq("id", profileId);
    if (merchantId) {
      await admin.from("merchants").update({ status: "banned" }).eq("id", merchantId);
    }

    revalidatePath("/admin/contas");
    return { result: "banned" };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(profileId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/contas");
  return { result: "deleted" };
}
