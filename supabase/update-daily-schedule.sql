-- Adicionar coluna de géneros à tabela daily_schedule
ALTER TABLE daily_schedule ADD COLUMN IF NOT EXISTS genres VARCHAR(255) DEFAULT '';

-- Limpar dados antigos
DELETE FROM daily_schedule;

-- Inserir nova programação diária
INSERT INTO daily_schedule (period, period_label, time_range, slot_time, slot_name, genres, sort_order, is_active) VALUES
  -- Madrugada (00H - 07H)
  ('madrugada', 'Madrugada', '00H - 07H', '00h',  'Midnight Session', 'Eletrónica, Indie, Lusófona',            1, true),
  ('madrugada', 'Madrugada', '00H - 07H', '03h',  'Relax Mode',       'Eletrónica, Indie, Lusófona',            2, true),

  -- Manhã (07H - 12H)
  ('manha', 'Manhã', '07H - 12H', '07h',   'Wake Up Mix',   'Pop, Rock, K-Pop, Eletrónica, Lusófona', 1, true),
  ('manha', 'Manhã', '07H - 12H', '09h',   'Hits da Manhã', 'Pop, K-Pop, Lusófona',                   2, true),
  ('manha', 'Manhã', '07H - 12H', '10h30', 'Mini Break',    'Pop, Indie, Lusófona',                   3, true),

  -- Tarde (12H - 18H)
  ('tarde', 'Tarde', '12H - 18H', '12h', 'Lunch Beats',  'Pop, Indie, Lusófona',              1, true),
  ('tarde', 'Tarde', '12H - 18H', '14h', 'Chill & Work', 'Indie, Eletrónica, Lusófona',       2, true),
  ('tarde', 'Tarde', '12H - 18H', '16h', 'Power Hour',   'Pop, Rock, K-Pop, Eletrónica',      3, true),

  -- Noite (18H - 00H)
  ('noite', 'Noite', '18H - 00H', '18h', 'Sunset Mix',       'Pop, Indie, Eletrónica, Lusófona',       1, true),
  ('noite', 'Noite', '18H - 00H', '20h', 'Especial do Dia',  'TODOS os géneros',                       2, true),
  ('noite', 'Noite', '18H - 00H', '21h', 'Canal Infantil',   'Músicas infantis e brincadeiras',        3, true),
  ('noite', 'Noite', '18H - 00H', '22h', 'Night Flow',       'Indie, Eletrónica, Lusófona',            4, true);
