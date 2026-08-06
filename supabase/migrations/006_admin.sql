-- Migração 006 — painel de administração (papel admin, contas bloqueadas).
-- Rodar no SQL Editor do Supabase.

-- =========================================================
-- PROFILES — permitir o papel 'admin' e marcar contas bloqueadas
-- =========================================================
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'merchant', 'courier', 'admin'));

alter table public.profiles add column banned_at timestamptz;

-- =========================================================
-- MERCHANTS — loja bloqueada some da listagem pública
-- =========================================================
alter table public.merchants drop constraint merchants_status_check;
alter table public.merchants add constraint merchants_status_check
  check (status in ('pending', 'approved', 'banned'));

-- =========================================================
-- Depois de rodar esta migração, promova sua própria conta a admin
-- trocando o e-mail abaixo pelo seu (rode só esta linha, uma vez):
--
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'seu-email@exemplo.com');
-- =========================================================
