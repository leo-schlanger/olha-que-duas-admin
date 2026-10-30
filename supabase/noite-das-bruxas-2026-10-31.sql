-- Especial adulto «Noite das Bruxas» — só no sábado 31/10/2026, 20h–00h; partilha
-- a hora com o Divas e Reis só nesse dia (decisão do Leo). Rádio: playlists
-- 124–129 (ver CLAUDE.md da rádio). Emissão com data em schedule_dates
-- (nunca em schedule). Horas de Lisboa; fim à meia-noite = '00:00'.
WITH ev AS (
  INSERT INTO events (name, description, icon_url, is_active)
  VALUES (
    'Noite das Bruxas',
    'Especial de Halloween para adultos: rock, mistério e canções enfeitiçadas, com vinhetas e Lendas de Portugal nas vozes da Alexandra e da Marluce. Só no sábado, 31 de outubro.',
    'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/1793388125278-noite-das-bruxas.png',
    true
  )
  RETURNING id
)
INSERT INTO schedule_dates (event_id, event_date, time, end_time, is_all_day, is_active)
SELECT id, DATE '2026-10-31', TIME '20:00', TIME '00:00', false, true FROM ev;
