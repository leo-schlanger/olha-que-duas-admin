-- Vidioteca Olha que Duas: recomendações de filmes (~30 s), semanal.
-- Sábado 13:00 e 17:00, domingo 11:00 e 17:00 (horas de Lisboa). day_of_week 0 = domingo.
-- Rádio: playlist «Programa Vidioteca Olha que Duas» (interrupt,single_track), pasta ProgramaVidioteca/,
-- script olhaqueduas-azuracast/scripts/vidioteca.sh. Ícone 128×128 do designer: event-icons/icons/vidioteca.png.
INSERT INTO events (id, name, description, icon_url, is_active)
VALUES (
  '082485ef-c168-44d3-b72f-050c7cffc729',
  'Vidioteca Olha que Duas',
  'Recomendações de filmes. Sábados às 13h e às 17h, domingos às 11h e às 17h.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/vidioteca.png',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO schedule (event_id, day_of_week, time, end_time, is_active, is_all_day)
SELECT '082485ef-c168-44d3-b72f-050c7cffc729', t.d, t.s::time, t.e::time, true, false
FROM (VALUES (6, '13:00', '13:05'), (6, '17:00', '17:05'), (0, '11:00', '11:05'), (0, '17:00', '17:05')) AS t(d, s, e)
WHERE NOT EXISTS (
  SELECT 1 FROM schedule WHERE event_id = '082485ef-c168-44d3-b72f-050c7cffc729' AND day_of_week = t.d AND time = t.s::time
);
