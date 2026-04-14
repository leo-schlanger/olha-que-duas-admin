-- Criar tabela de snapshots de ouvintes da rádio
CREATE TABLE IF NOT EXISTS radio_listener_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listeners_current INTEGER NOT NULL DEFAULT 0,
  listeners_unique INTEGER NOT NULL DEFAULT 0,
  listeners_total INTEGER NOT NULL DEFAULT 0,
  avg_listening_time INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radio_snapshots_recorded_at ON radio_listener_snapshots(recorded_at);

ALTER TABLE radio_listener_snapshots ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$ BEGIN
  CREATE POLICY "Allow public read on radio_listener_snapshots" ON radio_listener_snapshots
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all operations on radio_listener_snapshots" ON radio_listener_snapshots
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
