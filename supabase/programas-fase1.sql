-- Programas, fase 1 (20/11/2026, plano ~/.cache/programas-ia-2011/arquitetura.md §2.2).
-- Aditiva e reversível. Correr com:
--   cd /mnt/d/Projetos/olha-que-duas-admin && npx supabase db query --linked --yes -f supabase/programas-fase1.sql
begin;

alter table exclusive_programs
  add column if not exists event_id uuid null references events(id) on delete set null,
  add column if not exists long_description text null;
create unique index if not exists exclusive_programs_event_id_key
  on exclusive_programs(event_id) where event_id is not null;

alter table vinagre_posts
  add column if not exists audio_url text null,
  add column if not exists audio_duration_seconds integer null;
create index if not exists vinagre_posts_program_pub_idx
  on vinagre_posts(program_id, published_at desc) where is_published;

-- Fatia vertical: Mente Aberta ligada ao evento da rádio (terça 11:00 e 17:00).
update exclusive_programs set event_id = 'fe2f08cf-bea8-4c9f-885e-710d8c90264b'
  where slug = 'mente-aberta';

-- Decisão do Leo (20/11): Lendas de Portugal é do Leo Schlanger.
update exclusive_programs set author = 'Leo Schlanger' where slug = 'lendas-de-portugal';

commit;

-- down:
-- drop index if exists vinagre_posts_program_pub_idx; drop index if exists exclusive_programs_event_id_key;
-- alter table vinagre_posts drop column if exists audio_duration_seconds, drop column if exists audio_url;
-- alter table exclusive_programs drop column if exists long_description, drop column if exists event_id;
-- update exclusive_programs set author = 'Alexandra Serra' where slug = 'lendas-de-portugal';
