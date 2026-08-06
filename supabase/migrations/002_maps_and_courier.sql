-- Migração 002 — mapas (loja + entrega) e papel de entregador.
-- Rodar no SQL Editor do Supabase (projeto já tem o schema.sql original aplicado).

-- =========================================================
-- PROFILES — permitir o papel 'courier'
-- =========================================================
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'merchant', 'courier'));

-- =========================================================
-- MERCHANTS — localização da loja
-- =========================================================
alter table public.merchants add column latitude double precision;
alter table public.merchants add column longitude double precision;

-- =========================================================
-- ORDERS — entregador atribuído + localização de entrega
-- =========================================================
alter table public.orders add column courier_id uuid references public.profiles(id);
alter table public.orders add column delivery_latitude double precision;
alter table public.orders add column delivery_longitude double precision;

-- Entregador vê: pedidos que já aceitou, ou pedidos "em preparo" ainda
-- sem entregador (pool de entregas disponíveis).
create policy "Entregador vê entregas disponíveis e as próprias"
  on public.orders for select
  using (
    courier_id = auth.uid()
    or (
      courier_id is null
      and status = 'preparing'
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'courier')
    )
  );

-- Entregador pode aceitar uma entrega disponível (vira dono do pedido)
-- ou atualizar o status de uma entrega que já é sua.
create policy "Entregador aceita ou atualiza entrega"
  on public.orders for update
  using (
    courier_id = auth.uid()
    or (courier_id is null and status = 'preparing')
  )
  with check (courier_id = auth.uid());

-- =========================================================
-- COURIER_LOCATIONS — posição em tempo real do entregador
-- =========================================================
create table public.courier_locations (
  courier_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz not null default now()
);

alter table public.courier_locations enable row level security;

create policy "Entregador grava a própria localização"
  on public.courier_locations for insert
  with check (courier_id = auth.uid());

create policy "Entregador atualiza a própria localização"
  on public.courier_locations for update
  using (courier_id = auth.uid());

create policy "Localização visível para entregador, cliente e lojista da entrega ativa"
  on public.courier_locations for select
  using (
    courier_id = auth.uid()
    or exists (
      select 1 from public.orders o
      where o.courier_id = courier_locations.courier_id
        and o.status = 'out_for_delivery'
        and (
          o.customer_id = auth.uid()
          or exists (select 1 from public.merchants m where m.id = o.merchant_id and m.profile_id = auth.uid())
        )
    )
  );

alter publication supabase_realtime add table public.courier_locations;
