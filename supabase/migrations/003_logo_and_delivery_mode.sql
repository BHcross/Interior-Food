-- Migração 003 — logo da loja e escolha de modo de entrega.
-- Rodar no SQL Editor do Supabase.

alter table public.merchants add column logo_url text;

alter table public.merchants add column delivery_mode text not null default 'platform'
  check (delivery_mode in ('platform', 'own'));

-- A lista de "entregas disponíveis" (pool de entregadores do app) só deve
-- mostrar pedidos de lojas que optaram por usar entregadores do app.
-- Substitui a policy criada na migração 002.
drop policy "Entregador vê entregas disponíveis e as próprias" on public.orders;

create policy "Entregador vê entregas disponíveis e as próprias"
  on public.orders for select
  using (
    courier_id = auth.uid()
    or (
      courier_id is null
      and status = 'preparing'
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'courier')
      and exists (
        select 1 from public.merchants m
        where m.id = orders.merchant_id and m.delivery_mode = 'platform'
      )
    )
  );

-- Mesma regra para a policy de aceite (não deixa aceitar entrega de loja
-- que usa entregador próprio, mesmo tentando direto pela API).
drop policy "Entregador aceita ou atualiza entrega" on public.orders;

create policy "Entregador aceita ou atualiza entrega"
  on public.orders for update
  using (
    courier_id = auth.uid()
    or (
      courier_id is null
      and status = 'preparing'
      and exists (
        select 1 from public.merchants m
        where m.id = orders.merchant_id and m.delivery_mode = 'platform'
      )
    )
  )
  with check (courier_id = auth.uid());
