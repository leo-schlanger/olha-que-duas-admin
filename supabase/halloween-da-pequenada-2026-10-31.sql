-- Especial «Halloween da Pequenada» — só no sábado 31/10/2026, dentro do
-- Cantinho da Pequenada (rádio: playlists 120–123, ver CLAUDE.md da rádio).
-- Emissões com data em schedule_dates (nunca em schedule, que é semanal).
-- Horas de Lisboa. Ícone 128×128 do designer no bucket event-icons.
WITH ev AS (
  INSERT INTO events (name, description, icon_url, is_active)
  VALUES (
    'Halloween da Pequenada',
    'Especial de Halloween no Cantinho da Pequenada: canções de fantasmas, esqueletos, abóboras e tubarões, com a Leonor. Só no sábado, 31 de outubro.',
    'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/1793370905734-halloween-pequenada.png',
    true
  )
  RETURNING id
)
INSERT INTO schedule_dates (event_id, event_date, time, end_time, is_all_day, is_active)
SELECT id, DATE '2026-10-31', t.s::time, t.e::time, false, true
FROM ev, (VALUES ('11:00', '13:00'), ('18:30', '19:30')) AS t(s, e);
