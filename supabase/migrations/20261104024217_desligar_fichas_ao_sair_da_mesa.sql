-- Achado 3: ao apagar um vínculo em campaign_members (leave_campaign, DELETE direto do jogador,
-- Mestre removendo o jogador, cascata de campanha/usuário), as fichas do usuário naquela mesa
-- são desligadas. Compatível com leave_campaign (que já faz o UPDATE antes; aqui vira no-op).
-- Reverter:
--   drop trigger if exists campaign_members_desliga_fichas on public.campaign_members;
--   drop function if exists private.desligar_fichas_ao_sair();
create or replace function private.desligar_fichas_ao_sair()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.characters set campaign_id = null
   where campaign_id = old.campaign_id and owner_id = old.user_id;
  return old;
end $$;
revoke all on function private.desligar_fichas_ao_sair() from public, anon, authenticated;
create trigger campaign_members_desliga_fichas
  after delete on public.campaign_members
  for each row execute function private.desligar_fichas_ao_sair();
