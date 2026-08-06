import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a service role key — ignora RLS e tem acesso à API de admin
// do Supabase Auth (banir/excluir usuários). Só pode ser usado em código
// de servidor (server actions, server components dentro de src/app/admin),
// nunca importado por um componente "use client".
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
