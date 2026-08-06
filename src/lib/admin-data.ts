import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, Role } from "@/lib/types";

export interface RevenueSummary {
  totalDelivered: number;
  deliveredCount: number;
  inProgressCount: number;
  cancelledCount: number;
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  const supabase = createAdminClient();

  const { data: orders } = await supabase.from("orders").select("status, total");

  const rows = (orders ?? []) as { status: OrderStatus; total: number }[];

  const inProgressStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
  ];

  return {
    totalDelivered: rows
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.total), 0),
    deliveredCount: rows.filter((o) => o.status === "delivered").length,
    inProgressCount: rows.filter((o) => inProgressStatuses.includes(o.status)).length,
    cancelledCount: rows.filter((o) => o.status === "cancelled").length,
  };
}

export interface MerchantRevenue {
  merchantId: string;
  merchantName: string;
  merchantStatus: string;
  totalDelivered: number;
  deliveredCount: number;
}

export async function getRevenueByMerchant(): Promise<MerchantRevenue[]> {
  const supabase = createAdminClient();

  const [{ data: merchants }, { data: orders }] = await Promise.all([
    supabase.from("merchants").select("id, name, status"),
    supabase.from("orders").select("merchant_id, total").eq("status", "delivered"),
  ]);

  const totals = new Map<string, { total: number; count: number }>();
  for (const o of (orders ?? []) as { merchant_id: string; total: number }[]) {
    const current = totals.get(o.merchant_id) ?? { total: 0, count: 0 };
    current.total += Number(o.total);
    current.count += 1;
    totals.set(o.merchant_id, current);
  }

  return (merchants ?? [])
    .map((m) => ({
      merchantId: m.id,
      merchantName: m.name,
      merchantStatus: m.status,
      totalDelivered: totals.get(m.id)?.total ?? 0,
      deliveredCount: totals.get(m.id)?.count ?? 0,
    }))
    .sort((a, b) => b.totalDelivered - a.totalDelivered);
}

export interface AdminAccount {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  banned_at: string | null;
  created_at: string;
  merchant?: { id: string; name: string; status: string };
}

export interface AdminAccounts {
  customers: AdminAccount[];
  couriers: AdminAccount[];
  merchants: AdminAccount[];
}

export async function getAccounts(): Promise<AdminAccounts> {
  const supabase = createAdminClient();

  const [{ data: profiles }, { data: merchants }, { data: usersPage }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, phone, banned_at, created_at")
      .neq("role", "admin")
      .order("created_at", { ascending: false }),
    supabase.from("merchants").select("id, profile_id, name, status"),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const merchantByProfileId = new Map(
    (merchants ?? []).map((m) => [m.profile_id, { id: m.id, name: m.name, status: m.status }]),
  );

  const accounts: AdminAccounts = { customers: [], couriers: [], merchants: [] };

  for (const p of (profiles ?? []) as { id: string; role: Role; full_name: string | null; phone: string | null; banned_at: string | null; created_at: string }[]) {
    const account: AdminAccount = {
      id: p.id,
      email: emailById.get(p.id) ?? "",
      full_name: p.full_name,
      phone: p.phone,
      banned_at: p.banned_at,
      created_at: p.created_at,
      merchant: merchantByProfileId.get(p.id),
    };

    if (p.role === "customer") accounts.customers.push(account);
    else if (p.role === "courier") accounts.couriers.push(account);
    else if (p.role === "merchant") accounts.merchants.push(account);
  }

  return accounts;
}
