-- Lendas de Portugal, semanal: sexta às 22:00 (horas de Lisboa), a partir do episódio 6.
-- NÃO aplicar antes de o ep.6 ser aprovado (correr site_programas_semanais.sh lendas).
-- Rádio: playlist «Programa Lendas de Portugal», pasta ProgramaLendas/, script olhaqueduas-azuracast/scripts/lendas.sh.
-- Ícone 128×128 do designer: event-icons/icons/lendas-de-portugal.png.
INSERT INTO events (id, name, description, icon_url, is_active)
VALUES (
  '4ed48be7-d5f6-437b-95b4-2d6e75b75315',
  'Lendas de Portugal',
  'Uma lenda portuguesa por semana. Sextas-feiras às 22h.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/lendas-de-portugal.png',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO schedule (event_id, day_of_week, time, end_time, is_active, is_all_day)
SELECT '4ed48be7-d5f6-437b-95b4-2d6e75b75315', 5, TIME '22:00', TIME '22:05', true, false
WHERE NOT EXISTS (SELECT 1 FROM schedule WHERE event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315' AND day_of_week = 5 AND time = TIME '22:00');
