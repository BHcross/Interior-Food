-- Schema do marketplace (MVP) — rodar no SQL Editor do Supabase.
-- Pode colar o arquivo inteiro e executar de uma vez.

create extension if not exists pgcrypto;

-- =========================================================
-- PROFILES — um registro por usuário autenticado (cliente ou lojista)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'merchant')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria automaticamente um profile quando alguém se cadastra.
-- O papel (role) e o nome vêm dos metadados passados no signUp().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- MERCHANTS — lojas cadastradas por usuários com role = 'merchant'
-- =========================================================
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  city text not null,
  address text,
  phone text,
  opening_hours text,
  delivery_fee numeric(10, 2) not null default 0,
  -- Sem painel de admin nesta fase do MVP, então a loja já nasce aprovada
  -- e visível publicamente. Quando houver moderação, mude o default para 'pending'.
  status text not null default 'approved' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

alter table public.merchants enable row level security;

create policy "Lojas aprovadas são públicas"
  on public.merchants for select
  using (status = 'approved' or profile_id = auth.uid());

create policy "Lojista cria a própria loja"
  on public.merchants for insert
  with check (profile_id = auth.uid());

create policy "Lojista edita a própria loja"
  on public.merchants for update
  using (profile_id = auth.uid());

-- =========================================================
-- CATEGORIES — categorias do cardápio de cada loja
-- =========================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

alter table public.categories enable row level security;

create policy "Categorias de lojas aprovadas são públicas"
  on public.categories for select
  using (
    exists (
      select 1 from public.merchants m
      where m.id = merchant_id and (m.status = 'approved' or m.profile_id = auth.uid())
    )
  );

create policy "Lojista gerencia categorias da própria loja"
  on public.categories for all
  using (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid())
  )
  with check (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid())
  );

-- =========================================================
-- PRODUCTS — itens do cardápio
-- =========================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Produtos de lojas aprovadas são públicos"
  on public.products for select
  using (
    exists (
      select 1 from public.merchants m
      where m.id = merchant_id and (m.status = 'approved' or m.profile_id = auth.uid())
    )
  );

create policy "Lojista gerencia produtos da própria loja"
  on public.products for all
  using (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid())
  )
  with check (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid())
  );

-- =========================================================
-- ORDERS — pedidos feitos pelos clientes
-- =========================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  merchant_id uuid not null references public.merchants(id),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_address text not null,
  payment_method text not null check (payment_method in ('dinheiro', 'pix')),
  notes text,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Cliente vê os próprios pedidos"
  on public.orders for select
  using (
    customer_id = auth.uid()
    or exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid())
  );

create policy "Cliente cria pedido para si mesmo"
  on public.orders for insert
  with check (customer_id = auth.uid());

create policy "Lojista atualiza status dos pedidos da própria loja"
  on public.orders for update
  using (exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid()));

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Habilita Realtime na tabela orders (usado para o cliente acompanhar o
-- status do pedido ao vivo, sem precisar recarregar a página).
alter publication supabase_realtime add table public.orders;

-- =========================================================
-- ORDER_ITEMS — itens de cada pedido (snapshot do produto no momento da compra)
-- =========================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  notes text
);

alter table public.order_items enable row level security;

create policy "Itens visíveis para quem vê o pedido"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or exists (select 1 from public.merchants m where m.id = o.merchant_id and m.profile_id = auth.uid())
        )
    )
  );

create policy "Cliente insere itens do próprio pedido"
  on public.order_items for insert
  with check (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- =========================================================
-- STORAGE — bucket público para fotos de produtos
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Fotos de produtos são públicas para leitura"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Lojista autenticado pode enviar fotos"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Lojista autenticado pode atualizar/remover as próprias fotos"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Lojista autenticado pode remover fotos"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');
