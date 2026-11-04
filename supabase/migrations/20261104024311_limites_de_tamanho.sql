-- Achado 7: limites de tamanho para JSON e nomes.
-- characters: o limite antigo (pg_column_size < 400000) bloqueava uma ficha legítima com foto da
-- máscara no limite do front (mascaraFoto até 400000 caracteres -> ficha ~415 kB). Novo limite 2 MB
-- (~5x a ficha máxima legítima; maior ficha atual ~6,5 kB).
alter table public.characters  add constraint characters_tamanho_v2 check (pg_column_size(data) < 2000000 and char_length(name) <= 120) not valid;
alter table public.characters  validate constraint characters_tamanho_v2;
alter table public.characters  drop constraint characters_tamanho;
-- npcs (maior atual ~1 kB; nome no front até 80), campanhas (combate: até 60 linhas pequenas),
-- modelos de NPC e nome de exibição.
alter table public.npcs        add constraint npcs_tamanho          check (pg_column_size(data) < 200000 and char_length(name) <= 120) not valid;
alter table public.campaigns   add constraint campaigns_tamanho     check (char_length(name) <= 120 and (combate is null or pg_column_size(combate) < 100000)) not valid;
alter table public.npc_modelos add constraint npc_modelos_tamanho   check (pg_column_size(data) < 200000) not valid;
alter table public.profiles    add constraint profiles_nome_tamanho check (display_name is null or char_length(display_name) <= 80) not valid;
alter table public.npcs        validate constraint npcs_tamanho;
alter table public.campaigns   validate constraint campaigns_tamanho;
alter table public.npc_modelos validate constraint npc_modelos_tamanho;
alter table public.profiles    validate constraint profiles_nome_tamanho;
-- Reverter:
--   alter table public.characters add constraint characters_tamanho check (pg_column_size(data) < 400000 and char_length(name) <= 120);
--   alter table public.characters drop constraint characters_tamanho_v2;
--   alter table public.npcs drop constraint npcs_tamanho;
--   alter table public.campaigns drop constraint campaigns_tamanho;
--   alter table public.npc_modelos drop constraint npc_modelos_tamanho;
--   alter table public.profiles drop constraint profiles_nome_tamanho;
