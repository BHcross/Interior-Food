import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // @supabase/ssr guarda a sessão em cookies em vez de localStorage, e por
  // causa disso o cliente não sincroniza sozinho o token usado pelo
  // Realtime. Sem isso, qualquer assinatura (`.channel().on('postgres_changes', ...)`)
  // que dependa de RLS baseada em auth.uid() simplesmente não recebe os
  // eventos (a conexão fica "SUBSCRIBED", mas nada chega).
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) supabase.realtime.setAuth(session.access_token);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) supabase.realtime.setAuth(session.access_token);
  });

  return supabase;
}
