-- Achado 2: anon só lê o livro publicado; objetos novos em public não nascem abertos ao anon.
-- Tabelas existentes
revoke all on all tables in schema public from anon;
grant select on table public.book_pages to anon;                 -- livro (RLS: só published)
revoke truncate, trigger, references on all tables in schema public from authenticated;
-- Funções existentes (as RPCs do app mantêm grant explícito a authenticated)
revoke execute on all functions in schema public from public, anon;
-- Padrões para objetos futuros criados pelo papel postgres (migrações)
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, trigger, references on tables from authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
alter default privileges for role postgres revoke execute on functions from public;  -- só funciona global
alter default privileges for role postgres in schema public revoke all on sequences from anon;
-- Observações:
--  * private.is_admin() continua executável por anon e USAGE em private continua para anon,
--    porque a política book_select (TO anon, authenticated) chama is_admin().
--  * Tabela nova que visitante precise ler: GRANT SELECT ... TO anon explicitamente.
--  * Função nova chamada pelo app: GRANT EXECUTE ... TO authenticated explicitamente.
-- Reverter:
--  grant all on table public.npc_modelos to anon;
--  grant truncate, trigger, references on all tables in schema public to authenticated;
--  alter default privileges for role postgres in schema public grant all on tables to anon;
--  alter default privileges for role postgres in schema public grant truncate, trigger, references on tables to authenticated;
--  alter default privileges for role postgres in schema public grant execute on functions to anon;
--  alter default privileges for role postgres grant execute on functions to public;
--  alter default privileges for role postgres in schema public grant all on sequences to anon;
