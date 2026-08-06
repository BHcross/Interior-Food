-- Migração 005 — código de confirmação de entrega (evita golpe de
-- entregador marcar "entregue" sem entregar de verdade).
-- Rodar no SQL Editor do Supabase.

create table public.order_delivery_codes (
  order_id uuid primary key references public.orders(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now()
);

alter table public.order_delivery_codes enable row level security;

-- Só o próprio cliente do pedido pode ver o código — nem o lojista, nem
-- o entregador. É por isso que a comparação do código do entregador
-- precisa acontecer numa função (abaixo), não numa consulta comum.
create policy "Cliente vê o próprio código de entrega"
  on public.order_delivery_codes for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_delivery_codes.order_id and o.customer_id = auth.uid()
    )
  );

-- Gera um código de 4 dígitos automaticamente pra todo pedido novo.
create function public.generate_delivery_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.order_delivery_codes (order_id, code)
  values (new.id, lpad(floor(random() * 10000)::text, 4, '0'));
  return new;
end;
$$;

create trigger orders_generate_delivery_code
  after insert on public.orders
  for each row execute function public.generate_delivery_code();

-- O entregador chama essa função com o código que o cliente informou.
-- Ela compara o código internamente (o entregador nunca lê o valor
-- correto) e só marca como "delivered" se bater.
create or replace function public.confirm_delivery_with_code(p_order_id uuid, p_code text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_courier_id uuid;
  v_stored_code text;
begin
  select courier_id into v_courier_id from public.orders where id = p_order_id;

  if v_courier_id is null or v_courier_id <> auth.uid() then
    return false;
  end if;

  select code into v_stored_code from public.order_delivery_codes where order_id = p_order_id;

  if v_stored_code is null or v_stored_code <> p_code then
    return false;
  end if;

  update public.orders set status = 'delivered' where id = p_order_id;
  return true;
end;
$$;

grant execute on function public.confirm_delivery_with_code(uuid, text) to authenticated;

-- O próprio cliente também pode confirmar que recebeu, sem precisar do
-- código (ele já sabe que recebeu). Função à parte pra evitar dar ao
-- cliente uma policy de UPDATE genérica na tabela orders.
create or replace function public.confirm_delivery_by_customer(p_order_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_status text;
begin
  select customer_id, status into v_customer_id, v_status from public.orders where id = p_order_id;

  if v_customer_id is null or v_customer_id <> auth.uid() then
    return false;
  end if;

  if v_status <> 'out_for_delivery' then
    return false;
  end if;

  update public.orders set status = 'delivered' where id = p_order_id;
  return true;
end;
$$;

grant execute on function public.confirm_delivery_by_customer(uuid) to authenticated;
