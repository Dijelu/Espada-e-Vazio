-- Achado 1: visão "pública" dos NPCs revelados para jogadores, sem dados do Mestre.
-- SECURITY DEFINER (para continuar funcionando depois que npcs_member_select for removida),
-- search_path vazio, nomes qualificados e checagem interna de vínculo com a campanha.
-- Reverter: drop function public.npcs_revelados(uuid);
create or replace function public.npcs_revelados(cid uuid)
returns table (id uuid, name text, data jsonb)
language sql stable security definer set search_path = ''
as $$
  select n.id, n.name, n.data - 'notas' - 'pvAtual' - 'prAtual' - 'pasta'
    from public.npcs n
   where n.campaign_id = cid
     and coalesce((n.data->>'revelado')::boolean, false)
     and (private.in_campaign(cid) or private.owns_campaign(cid))
   order by n.created_at;
$$;
comment on function public.npcs_revelados(uuid) is
  'NPCs revelados da campanha, sem notas/pvAtual/prAtual/pasta. Só membros ou o Mestre recebem linhas.';
revoke all on function public.npcs_revelados(uuid) from public, anon, authenticated;
grant execute on function public.npcs_revelados(uuid) to authenticated;
