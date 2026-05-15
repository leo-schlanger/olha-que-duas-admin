-- =============================================================
-- FASE 1: Tabela listener_sessions + Views Materializadas + RLS Fix
-- Execute este script no Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. Tabela de sessões individuais de ouvintes (retenção/cohort)
CREATE TABLE IF NOT EXISTS listener_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listener_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_seconds INTEGER DEFAULT 0,
  is_first_session BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries de retenção e performance
CREATE INDEX idx_listener_sessions_hash ON listener_sessions(listener_hash);
CREATE INDEX idx_listener_sessions_connected ON listener_sessions(connected_at);
CREATE INDEX idx_listener_sessions_country ON listener_sessions(country);
CREATE INDEX idx_listener_sessions_hash_connected ON listener_sessions(listener_hash, connected_at);

-- RLS: leitura pública, escrita restrita
ALTER TABLE listener_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on listener_sessions" ON listener_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow service role insert on listener_sessions" ON listener_sessions
  FOR INSERT WITH CHECK (true);

-- 2. Tabela de resumo diário (dados agregados para quando os granulares forem limpos)
CREATE TABLE IF NOT EXISTS listener_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL,
  country TEXT DEFAULT 'Unknown',
  unique_listeners INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  new_listeners INTEGER DEFAULT 0,
  returning_listeners INTEGER DEFAULT 0,
  avg_listen_seconds INTEGER DEFAULT 0,
  peak_concurrent INTEGER DEFAULT 0,
  tlh NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(summary_date, country)
);

CREATE INDEX idx_daily_summary_date ON listener_daily_summary(summary_date);

ALTER TABLE listener_daily_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on listener_daily_summary" ON listener_daily_summary
  FOR SELECT USING (true);

CREATE POLICY "Allow service role insert on listener_daily_summary" ON listener_daily_summary
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role update on listener_daily_summary" ON listener_daily_summary
  FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Corrigir RLS de radio_listener_snapshots (remover write público)
-- Primeiro remove a policy permissiva demais
DROP POLICY IF EXISTS "Allow all operations on radio_listener_snapshots" ON radio_listener_snapshots;

-- Cria policy restrita para insert (apenas service role usa isso)
CREATE POLICY "Allow service role insert on radio_listener_snapshots" ON radio_listener_snapshots
  FOR INSERT WITH CHECK (true);

-- 4. View materializada - Agregação horária
CREATE MATERIALIZED VIEW IF NOT EXISTS radio_stats_hourly AS
SELECT
  DATE_TRUNC('hour', recorded_at) AS hour,
  AVG(listeners_current)::INT AS avg_listeners,
  MAX(listeners_current) AS peak_listeners,
  MAX(listeners_unique) AS peak_unique,
  AVG(NULLIF(avg_listening_time, 0))::INT AS avg_listen_time,
  SUM(listeners_current) * (5.0 / 60) AS tlh,
  COUNT(*) AS snapshot_count
FROM radio_listener_snapshots
GROUP BY DATE_TRUNC('hour', recorded_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_radio_stats_hourly_hour ON radio_stats_hourly(hour);

-- 5. View materializada - Agregação diária
CREATE MATERIALIZED VIEW IF NOT EXISTS radio_stats_daily AS
SELECT
  DATE_TRUNC('day', recorded_at)::DATE AS day,
  AVG(listeners_current)::INT AS avg_listeners,
  MAX(listeners_current) AS peak_listeners,
  MAX(listeners_unique) AS peak_unique,
  AVG(NULLIF(avg_listening_time, 0))::INT AS avg_listen_time,
  SUM(listeners_current) * (5.0 / 60) AS tlh,
  COUNT(*) AS snapshot_count
FROM radio_listener_snapshots
GROUP BY DATE_TRUNC('day', recorded_at)::DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_radio_stats_daily_day ON radio_stats_daily(day);

-- 6. Cron para refresh das views materializadas (a cada hora)
SELECT cron.schedule(
  'refresh-radio-stats-hourly',
  '5 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY radio_stats_hourly;$$
);

SELECT cron.schedule(
  'refresh-radio-stats-daily',
  '10 0 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY radio_stats_daily;$$
);

-- 7. Cron de limpeza semanal (domingos às 3h)
-- Agrega dados antigos em listener_daily_summary antes de apagar
SELECT cron.schedule(
  'cleanup-old-analytics-data',
  '0 3 * * 0',
  $$
  -- Primeiro agrega dados de listener_sessions > 90 dias no resumo diário
  INSERT INTO listener_daily_summary (summary_date, country, unique_listeners, total_sessions, new_listeners, returning_listeners, avg_listen_seconds)
  SELECT
    connected_at::DATE AS summary_date,
    COALESCE(country, 'Unknown') AS country,
    COUNT(DISTINCT listener_hash) AS unique_listeners,
    COUNT(*) AS total_sessions,
    COUNT(*) FILTER (WHERE is_first_session = true) AS new_listeners,
    COUNT(*) FILTER (WHERE is_first_session = false) AS returning_listeners,
    AVG(NULLIF(connected_seconds, 0))::INT AS avg_listen_seconds
  FROM listener_sessions
  WHERE connected_at < NOW() - INTERVAL '90 days'
  GROUP BY connected_at::DATE, COALESCE(country, 'Unknown')
  ON CONFLICT (summary_date, country) DO UPDATE SET
    unique_listeners = EXCLUDED.unique_listeners,
    total_sessions = EXCLUDED.total_sessions,
    new_listeners = EXCLUDED.new_listeners,
    returning_listeners = EXCLUDED.returning_listeners,
    avg_listen_seconds = EXCLUDED.avg_listen_seconds;

  -- Depois apaga os granulares
  DELETE FROM listener_sessions WHERE connected_at < NOW() - INTERVAL '90 days';

  -- Apaga snapshots > 6 meses (os dados já estão nas views materializadas)
  DELETE FROM radio_listener_snapshots WHERE recorded_at < NOW() - INTERVAL '180 days';

  -- Refresh das views após limpeza
  REFRESH MATERIALIZED VIEW CONCURRENTLY radio_stats_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY radio_stats_daily;
  $$
);
