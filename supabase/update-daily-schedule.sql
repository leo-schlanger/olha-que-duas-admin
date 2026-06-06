-- Coluna de géneros/estilo da tabela daily_schedule
ALTER TABLE daily_schedule ADD COLUMN IF NOT EXISTS genres VARCHAR(255) DEFAULT '';

-- Coluna de ícone/foto por bloco (aberta para preencher depois, aos poucos — igual aos eventos)
ALTER TABLE daily_schedule ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500) DEFAULT '';

-- Bucket de storage para os ícones dos blocos (mesma config dos event-icons)
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-icons', 'schedule-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas públicas do bucket schedule-icons (espelho de event-icons)
DROP POLICY IF EXISTS "Schedule icons public read" ON storage.objects;
CREATE POLICY "Schedule icons public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'schedule-icons');

DROP POLICY IF EXISTS "Schedule icons public upload" ON storage.objects;
CREATE POLICY "Schedule icons public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'schedule-icons');

DROP POLICY IF EXISTS "Schedule icons public update" ON storage.objects;
CREATE POLICY "Schedule icons public update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'schedule-icons') WITH CHECK (bucket_id = 'schedule-icons');

DROP POLICY IF EXISTS "Schedule icons public delete" ON storage.objects;
CREATE POLICY "Schedule icons public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'schedule-icons');

-- Limpar dados antigos
DELETE FROM daily_schedule;

-- Inserir nova programação diária
-- A descrição (genres) é o ESTILO MUSICAL do bloco, não a lista de músicas.
-- A "playlist oficial" de cada bloco fica aberta a modificações no streamer.
INSERT INTO daily_schedule (period, period_label, time_range, slot_time, slot_name, genres, icon_url, sort_order, is_active) VALUES
  -- Manhã (07H - 12H)
  ('manha', 'Manhã', '07H - 12H', '07h-10h', 'Bom Dia, Duas!',     'Energia positiva, pop alegre, hits atuais, vibe de acordar bem', '', 1, true),
  ('manha', 'Manhã', '07H - 12H', '10h-12h', 'Manhã com Atitude',  'Pop forte, motivação, ritmo, músicas que puxam para cima',      '', 2, true),

  -- Tarde (12H - 18H)
  ('tarde', 'Tarde', '12H - 18H', '12h-14h', 'Almoço com Duas',    'Hits leves, pop suave, músicas que acompanham o almoço',        '', 1, true),
  ('tarde', 'Tarde', '12H - 18H', '14h-17h', 'Tarde em Movimento', 'Ritmo, pop dançável, músicas que puxam energia',                '', 2, true),
  ('tarde', 'Tarde', '12H - 18H', '17h-19h', 'Ritmo da Cidade',    'Urban pop, vibes modernas, mistura de pop, dance e R&B',        '', 3, true),

  -- Noite (18H - 00H)
  ('noite', 'Noite', '18H - 00H', '19h-21h', 'Golden Time',        'Luz suave, pop elegante, músicas de fim de tarde',              '', 1, true),
  ('noite', 'Noite', '18H - 00H', '21h-23h', 'Noite Duas',         'Romântico, emocional, íntimo',                                  '', 2, true),
  ('noite', 'Noite', '18H - 00H', '23h-00h', 'Love Sessions',      'Baladas, R&B suave, músicas de amor',                           '', 3, true),

  -- Madrugada (00H - 07H)
  ('madrugada', 'Madrugada', '00H - 07H', '00h-02h', 'Madrugada Chill',         'Calmo, atmosférico, indie, lo-fi, pop suave',               '', 1, true),
  ('madrugada', 'Madrugada', '00H - 07H', '02h-04h', 'Noite Adentro',           'Misterioso, profundo, eletrónico suave, indie alternativo', '', 2, true),
  ('madrugada', 'Madrugada', '00H - 07H', '04h-07h', 'Amanhecer Olha que Duas', 'Luz suave, esperança, músicas que abrem o dia',             '', 3, true);
