-- «Céu de cada mês» (rubrica mensal da Teresa; rádio: playlist «Céu de Cada Mês»).
-- Novembro 2026: seg 16/11, qua 18/11 e sex 20/11 às 10:30 (Lisboa), ~3 min.
-- Tema: energias para a segunda metade de novembro (cartas Torre e Chave).
--
-- Desde 01/04/2026 o evento estava na grelha SEMANAL (`schedule`, seg/qua/sex
-- 10:30-10:45), por isso aparecia todas as semanas. A rubrica é mensal: as linhas
-- semanais ficam inativas (não apagadas) e as emissões passam a `schedule_dates`.
-- Mesmo horário das linhas antigas (10:30-10:45). Idempotente.
-- O evento estava inativo (por isso outubro não apareceu no site/app); sem a
-- grelha semanal, reativá-lo só mostra as emissões com data.
BEGIN;

UPDATE events
SET is_active = true
WHERE id = '7e0a2799-f6f6-4d7f-8d59-6edbe2dd291b';

UPDATE schedule
SET is_active = false
WHERE event_id = '7e0a2799-f6f6-4d7f-8d59-6edbe2dd291b'
  AND is_active;

INSERT INTO schedule_dates (event_id, event_date, time, end_time, is_all_day, is_active)
SELECT '7e0a2799-f6f6-4d7f-8d59-6edbe2dd291b', d.dt, TIME '10:30', TIME '10:45', false, true
FROM (VALUES (DATE '2026-11-16'), (DATE '2026-11-18'), (DATE '2026-11-20')) AS d(dt)
ON CONFLICT (event_id, event_date, time) DO UPDATE
  SET end_time = EXCLUDED.end_time, is_active = true;

COMMIT;
