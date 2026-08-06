-- Migração 008 — impede a loja de marcar pedido como "entregue" direto.
-- Rodar no SQL Editor do Supabase.
--
-- Bug encontrado: o painel da loja deixava avançar o pedido até
-- "entregue" sem passar pelo código de confirmação (que só era exigido
-- do entregador). Isso permitia a loja marcar como entregue sem o
-- cliente ter recebido de verdade — o golpe que o código de entrega
-- (migração 005) foi criado justamente para evitar.
--
-- Agora, mesmo chamando a API do Supabase diretamente (sem passar pelo
-- site), a loja não consegue mais definir status = 'delivered'. Isso só
-- acontece através das funções confirm_delivery_with_code (entregador,
-- com código) ou confirm_delivery_by_customer (cliente confirma
-- sozinho), que rodam como SECURITY DEFINER e não são afetadas por
-- esta policy.
drop policy "Lojista atualiza status dos pedidos da própria loja" on public.orders;

create policy "Lojista atualiza status dos pedidos da própria loja"
  on public.orders for update
  using (exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid()))
  with check (
    exists (select 1 from public.merchants m where m.id = merchant_id and m.profile_id = auth.uid())
    and status <> 'delivered'
  );
