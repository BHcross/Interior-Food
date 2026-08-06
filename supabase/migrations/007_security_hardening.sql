-- Migração 007 — hardening de segurança.
-- Rodar no SQL Editor do Supabase.

-- =========================================================
-- 1) Corrige escalonamento de privilégio no cadastro.
--
-- O trigger antigo confiava cegamente no campo "role" enviado nos
-- metadados do signUp. Qualquer pessoa com a chave anon (pública) pode
-- chamar a API do Supabase Auth diretamente — sem passar pelo site — e
-- mandar role: 'admin' (ou qualquer valor) nos metadados, virando admin
-- na hora do cadastro. Agora só 'customer', 'merchant' e 'courier' são
-- aceitos; qualquer outro valor (incluindo 'admin') cai para 'customer'.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  v_role := new.raw_user_meta_data->>'role';
  if v_role not in ('customer', 'merchant', 'courier') then
    v_role := 'customer';
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    v_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

-- =========================================================
-- 2) Trava campos financeiros/de identidade do pedido contra alteração.
--
-- As policies de UPDATE de "orders" (lojista, entregador) restringem
-- quais LINHAS podem ser alteradas, mas não quais COLUNAS. Sem isso,
-- um lojista ou entregador autenticado poderia chamar a API do Supabase
-- diretamente (sem passar pelo site) e alterar total, taxa de entrega,
-- endereço, forma de pagamento ou até o dono do pedido. Esses campos só
-- podem ser definidos na criação do pedido; depois disso ficam travados
-- no valor original independentemente de quem faça o update.
-- =========================================================
create or replace function public.protect_order_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  new.customer_id := old.customer_id;
  new.merchant_id := old.merchant_id;
  new.total := old.total;
  new.delivery_fee := old.delivery_fee;
  new.payment_method := old.payment_method;
  new.delivery_address := old.delivery_address;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists orders_protect_immutable_fields on public.orders;
create trigger orders_protect_immutable_fields
  before update on public.orders
  for each row execute function public.protect_order_immutable_fields();

-- =========================================================
-- 3) Restringe o bucket de imagens (product-images).
--
-- Antes: qualquer usuário autenticado (inclusive cliente ou entregador)
-- podia enviar, sobrescrever ou apagar QUALQUER arquivo no bucket, sem
-- limite de tamanho ou tipo. Agora: só imagens, até 5MB, só quem tem
-- role = 'merchant', e cada um só mexe na própria pasta (primeiro nível
-- do caminho = o próprio user id — ver mudança em merchant-form.tsx e
-- product-manager.tsx).
-- =========================================================
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
where id = 'product-images';

drop policy if exists "Lojista autenticado pode enviar fotos" on storage.objects;
drop policy if exists "Lojista autenticado pode atualizar/remover as próprias fotos" on storage.objects;
drop policy if exists "Lojista autenticado pode remover fotos" on storage.objects;

create policy "Lojista envia fotos na própria pasta"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'merchant')
  );

create policy "Lojista atualiza fotos na própria pasta"
  on storage.objects for update
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Lojista remove fotos na própria pasta"
  on storage.objects for delete
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
