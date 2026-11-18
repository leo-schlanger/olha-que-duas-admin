-- Especial Baby Shark, 11.º aniversário — só quarta 25/11/2026, 18:30–19:30.
-- Emissão única em schedule_dates (nunca em schedule, que é semanal).
-- Rádio: playlist 137 «Eventos - Baby Shark 11 Anos», schedule 444,
-- 18:25–19:30, start_date=end_date=2026-11-25. O Cantinho (53) sai só
-- nessa noite (schedule 163 até 24/11, schedule 445 desde 26/11).
-- Horas de Lisboa. Ícone = o do Cantinho da Pequenada (sem capa nova).
WITH ev AS (
  INSERT INTO events (name, description, icon_url, is_active)
  VALUES (
    'Especial Baby Shark – 11.º Aniversário',
    'Mega especial do 11.º aniversário do Baby Shark no Cantinho da Pequenada, com a Leonor. Quarta-feira, 25 de novembro, às 18h30.',
    'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/1776166765546-klx0ud.png',
    true
  )
  RETURNING id
)
INSERT INTO schedule_dates (event_id, event_date, time, end_time, is_all_day, is_active)
SELECT id, DATE '2026-11-25', TIME '18:30', TIME '19:30', false, true
FROM ev;
