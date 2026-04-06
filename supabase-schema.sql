-- Tabela de eventos
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de programação semanal
CREATE TABLE schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, day_of_week, time)
);

-- Índices para melhor performance
CREATE INDEX idx_schedule_day_of_week ON schedule(day_of_week);
CREATE INDEX idx_schedule_event_id ON schedule(event_id);
CREATE INDEX idx_events_is_active ON events(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura (consumido pelo app web/mobile)
CREATE POLICY "Allow public read access on events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on schedule" ON schedule
  FOR SELECT USING (true);

-- Políticas de escrita (apenas via service role key no admin)
-- No admin, você deve usar a service role key para operações de escrita
-- Ou criar políticas mais específicas baseadas em autenticação

-- Para desenvolvimento, permitir todas as operações
CREATE POLICY "Allow all operations on events" ON events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on schedule" ON schedule
  FOR ALL USING (true) WITH CHECK (true);

-- Tabela de programação diária da rádio
CREATE TABLE daily_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(20) NOT NULL,        -- 'manha', 'tarde', 'noite', 'madrugada'
  period_label VARCHAR(50) NOT NULL,  -- 'Manhã', 'Tarde', 'Noite', 'Madrugada'
  time_range VARCHAR(20) NOT NULL,    -- '07H - 12H'
  slot_time VARCHAR(10) NOT NULL,     -- '07h', '10h30'
  slot_name VARCHAR(100) NOT NULL,    -- 'Wake Up Mix'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_schedule_period ON daily_schedule(period);
CREATE INDEX idx_daily_schedule_active ON daily_schedule(is_active);

ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on daily_schedule" ON daily_schedule
  FOR SELECT USING (true);

CREATE POLICY "Allow all operations on daily_schedule" ON daily_schedule
  FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket para ícones
-- Execute no Supabase Dashboard > Storage > Create new bucket
-- Nome: event-icons
-- Public: Yes

-- Política de storage para leitura pública
-- No Supabase Dashboard > Storage > event-icons > Policies
-- Criar política: Allow public access for reading
-- Target: SELECT
-- Policy: true
