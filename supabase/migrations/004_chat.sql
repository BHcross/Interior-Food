-- Migração 004 — chat entre cliente, loja e entregador (por pedido).
-- Rodar no SQL Editor do Supabase.

create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  channel text not null check (channel in ('customer_merchant', 'customer_courier', 'merchant_courier')),
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.order_messages enable row level security;

create policy "Participantes do canal veem as mensagens"
  on public.order_messages for select
  using (
    exists (
      select 1 from public.orders o
      left join public.merchants m on m.id = o.merchant_id
      where o.id = order_messages.order_id
        and (
          (order_messages.channel = 'customer_merchant' and (auth.uid() = o.customer_id or auth.uid() = m.profile_id))
          or (order_messages.channel = 'customer_courier' and (auth.uid() = o.customer_id or auth.uid() = o.courier_id))
          or (order_messages.channel = 'merchant_courier' and (auth.uid() = m.profile_id or auth.uid() = o.courier_id))
        )
    )
  );

create policy "Participantes do canal enviam mensagens"
  on public.order_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.orders o
      left join public.merchants m on m.id = o.merchant_id
      where o.id = order_messages.order_id
        and (
          (order_messages.channel = 'customer_merchant' and (auth.uid() = o.customer_id or auth.uid() = m.profile_id))
          or (order_messages.channel = 'customer_courier' and (auth.uid() = o.customer_id or auth.uid() = o.courier_id))
          or (order_messages.channel = 'merchant_courier' and (auth.uid() = m.profile_id or auth.uid() = o.courier_id))
        )
    )
  );

alter publication supabase_realtime add table public.order_messages;
