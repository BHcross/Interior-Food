-- Migração 009 — chat de suporte (dúvidas de clientes, entregadores e lojas).
-- Rodar no SQL Editor do Supabase.

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

-- Cada usuário só vê e escreve na própria conversa de suporte. O admin
-- não usa esta policy — o painel /admin/suporte acessa via service role
-- (mesmo padrão do resto do painel de admin), então enxerga todas as
-- conversas sem precisar de uma policy extra aqui.
create policy "Usuário vê a própria conversa de suporte"
  on public.support_messages for select
  using (user_id = auth.uid());

create policy "Usuário envia mensagem na própria conversa de suporte"
  on public.support_messages for insert
  with check (user_id = auth.uid() and sender_id = auth.uid());

alter publication supabase_realtime add table public.support_messages;
