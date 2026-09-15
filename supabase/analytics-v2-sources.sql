-- =============================================================
-- Analytics v2 — origens, dispositivos e saúde da recolha
--
-- Executar DEPOIS de analytics-v2.sql e ANTES de fazer deploy da nova
-- versão do radio-snapshot-cron (que grava connections_ok).
--
-- 1. A app (a partir da v2.3.0) identifica-se com o user-agent
--    "OlhaQueDuas/<versão> (Android|iOS)". Versões antigas no Android
--    continuam a chegar como "okhttp/x"; no iOS eram indistinguíveis
--    do Safari e de outras apps (AppleCoreMedia).
-- 2. Nova divisão por dispositivo (telemóvel / computador / outro).
-- 3. Detalhe por aplicação (user-agent) para auditar as origens.
-- 4. Cada fotografia regista se a recolha do histórico correu bem.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Classificação da origem
-- -------------------------------------------------------------
--   app_android : app Olha Que Duas no Android ("OlhaQueDuas/… (Android)"
--                 ou "okhttp/x" das versões anteriores à 2.3.0)
--   app_ios     : app Olha Que Duas no iOS ("OlhaQueDuas/… (iOS)")
--   mytuner     : myTuner (Android e iOS)
--   ios         : outros players de iPhone/iPad (Safari, apps de rádio)
--   browser     : browsers (site e diretórios web de rádios)
--   outras_apps : outras apps/players (Dalvik, ExoPlayer, VLC, Roku…)
--   bot         : crawlers e monitores (excluídos das métricas)
CREATE OR REPLACE FUNCTION classify_listener_source(ua TEXT, bot BOOLEAN DEFAULT false)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(bot, false)
      OR COALESCE(ua, '') ~* '(bot|crawler|spider|heritrix|curl/|wget|python-requests|uptime)' THEN 'bot'
    WHEN ua ~* '^OlhaQueDuas/.*\(iOS' THEN 'app_ios'
    WHEN ua ~* '^OlhaQueDuas/' THEN 'app_android'
    WHEN ua ~* 'mytuner' THEN 'mytuner'
    WHEN ua ~* '^okhttp/' THEN 'app_android'
    WHEN ua ~* '(AppleCoreMedia|CFNetwork)' THEN 'ios'
    WHEN ua ~* '^Mozilla/' THEN 'browser'
    ELSE 'outras_apps'
  END
$$;

-- Dispositivo: apps de telemóvel contam sempre como telemóvel; nos browsers
-- e noutros players usa-se a deteção do AzuraCast (is_mobile).
CREATE OR REPLACE FUNCTION classify_listener_device(src TEXT, mobile BOOLEAN)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN src IN ('app_android', 'app_ios', 'mytuner', 'ios') THEN 'telemovel'
    WHEN mobile IS TRUE THEN 'telemovel'
    WHEN src = 'browser' AND mobile IS FALSE THEN 'computador'
    ELSE 'outro'
  END
$$;

-- Reclassificar o histórico (o trigger recalcula a origem no UPDATE)
UPDATE listener_connections
SET source = classify_listener_source(user_agent, is_bot)
WHERE source IS DISTINCT FROM classify_listener_source(user_agent, is_bot);

-- -------------------------------------------------------------
-- 2. Ligações num intervalo: passa a devolver user-agent e dispositivo
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS radio_connections_in_range(TIMESTAMPTZ, TIMESTAMPTZ);
CREATE FUNCTION radio_connections_in_range(p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS TABLE(
  listener_hash TEXT,
  source TEXT,
  country TEXT,
  connected_on TIMESTAMPTZ,
  seconds_in_range NUMERIC,
  full_seconds INTEGER,
  user_agent TEXT,
  device TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.listener_hash,
    c.source,
    c.country,
    c.connected_on,
    GREATEST(0, EXTRACT(EPOCH FROM (LEAST(c.connected_until, p_end) - GREATEST(c.connected_on, p_start))))::NUMERIC,
    c.connected_seconds,
    c.user_agent,
    classify_listener_device(c.source, c.is_mobile)
  FROM listener_connections c
  WHERE c.connected_on < p_end
    AND c.connected_until > p_start
    AND c.source <> 'bot'
$$;

-- -------------------------------------------------------------
-- 3. Novas RPCs
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION radio_audience_by_device(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  device TEXT,
  listeners BIGINT,
  sessions BIGINT,
  listening_hours NUMERIC,
  hours_share NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH b AS (
    SELECT * FROM radio_period_bounds(days_back, 0)
  ),
  c AS (
    SELECT x.* FROM b CROSS JOIN LATERAL radio_connections_in_range(b.period_start, b.period_end) x
  ),
  per_listener AS (
    SELECT c.device, c.listener_hash, SUM(c.seconds_in_range) AS s FROM c GROUP BY 1, 2
  ),
  total AS (
    SELECT SUM(c.seconds_in_range) AS t FROM c
  )
  SELECT
    c.device,
    (SELECT COUNT(*) FROM per_listener pl WHERE pl.device = c.device AND pl.s >= 60),
    COUNT(*) FILTER (WHERE c.seconds_in_range >= 60),
    ROUND(SUM(c.seconds_in_range) / 3600.0, 1),
    ROUND(SUM(c.seconds_in_range) / NULLIF((SELECT t FROM total), 0), 3)
  FROM c
  GROUP BY c.device
  ORDER BY SUM(c.seconds_in_range) DESC
$$;

-- Aplicações (user-agent) que geram as ligações, para auditar as origens.
CREATE OR REPLACE FUNCTION radio_audience_by_client(days_back INTEGER DEFAULT 30, max_rows INTEGER DEFAULT 15)
RETURNS TABLE(
  user_agent TEXT,
  source TEXT,
  device TEXT,
  listeners BIGINT,
  sessions BIGINT,
  short_connections BIGINT,
  listening_hours NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH b AS (
    SELECT * FROM radio_period_bounds(days_back, 0)
  ),
  c AS (
    SELECT x.*, COALESCE(x.user_agent, '(sem user-agent)') AS ua
    FROM b CROSS JOIN LATERAL radio_connections_in_range(b.period_start, b.period_end) x
  ),
  per_listener AS (
    SELECT c.ua, c.listener_hash, SUM(c.seconds_in_range) AS s FROM c GROUP BY 1, 2
  ),
  listeners_per_ua AS (
    SELECT pl.ua, COUNT(*) FILTER (WHERE pl.s >= 60) AS n FROM per_listener pl GROUP BY pl.ua
  )
  SELECT
    left(c.ua, 160),
    MAX(c.source),
    MAX(c.device),
    COALESCE(MAX(l.n), 0),
    COUNT(*) FILTER (WHERE c.seconds_in_range >= 60),
    COUNT(*) FILTER (WHERE c.seconds_in_range < 60),
    ROUND(SUM(c.seconds_in_range) / 3600.0, 2)
  FROM c
  LEFT JOIN listeners_per_ua l ON l.ua = c.ua
  GROUP BY c.ua
  ORDER BY SUM(c.seconds_in_range) DESC
  LIMIT GREATEST(max_rows, 1)
$$;

-- -------------------------------------------------------------
-- 4. Saúde da recolha
-- -------------------------------------------------------------
ALTER TABLE radio_listener_snapshots ADD COLUMN IF NOT EXISTS connections_ok BOOLEAN;

--   last_snapshot_at        : última fotografia (deve ter < 15 min)
--   last_connections_ok_at  : última execução com o histórico recolhido
--   failed_runs_24h         : execuções das últimas 24 h em que o histórico falhou
CREATE OR REPLACE FUNCTION radio_collection_health()
RETURNS TABLE(
  last_snapshot_at TIMESTAMPTZ,
  last_connections_ok_at TIMESTAMPTZ,
  failed_runs_24h BIGINT,
  last_connection_at TIMESTAMPTZ
)
LANGUAGE sql STABLE AS $$
  SELECT
    (SELECT MAX(recorded_at) FROM radio_listener_snapshots),
    (SELECT MAX(recorded_at) FROM radio_listener_snapshots WHERE connections_ok IS TRUE),
    (SELECT COUNT(*) FROM radio_listener_snapshots
      WHERE connections_ok IS FALSE AND recorded_at > NOW() - INTERVAL '24 hours'),
    (SELECT MAX(connected_until) FROM listener_connections)
$$;

-- -------------------------------------------------------------
-- 5. Permissões
-- -------------------------------------------------------------
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'radio_connections_in_range(timestamptz, timestamptz)',
    'radio_audience_by_device(integer)',
    'radio_audience_by_client(integer, integer)',
    'radio_collection_health()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END $$;
