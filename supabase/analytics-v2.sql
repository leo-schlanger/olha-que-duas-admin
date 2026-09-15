-- =============================================================
-- Analytics v2 da rádio
--
-- Substitui a recolha amostrada (listener_sessions, gravada a cada 5 min
-- com duplicados) pelo histórico de ligações do próprio AzuraCast
-- (/api/station/1/listeners?unique=false), que regista TODAS as ligações,
-- incluindo as curtas. As fotografias de 5 em 5 min continuam a existir
-- para os ouvintes simultâneos (média, pico, heatmap).
--
-- Tudo em hora de Lisboa. Todas as funções são SECURITY INVOKER: o RLS
-- (só administradores, ver admin-auth.sql) decide quem vê os dados.
--
-- Executar DEPOIS de admin-auth.sql (usa is_admin()).
-- =============================================================

-- -------------------------------------------------------------
-- 1. Ligações de ouvintes (fonte: histórico AzuraCast)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listener_connections (
  id BIGSERIAL PRIMARY KEY,
  listener_hash TEXT NOT NULL,
  connected_on TIMESTAMPTZ NOT NULL,
  connected_until TIMESTAMPTZ NOT NULL,
  connected_seconds INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  client TEXT,
  is_mobile BOOLEAN,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  country TEXT,
  city TEXT,
  mount TEXT,
  source TEXT NOT NULL DEFAULT 'outras_apps',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listener_connections_hash_start_key UNIQUE (listener_hash, connected_on)
);

CREATE INDEX IF NOT EXISTS idx_listener_connections_on ON listener_connections(connected_on);
CREATE INDEX IF NOT EXISTS idx_listener_connections_until ON listener_connections(connected_until);

ALTER TABLE listener_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read listener_connections" ON listener_connections;
CREATE POLICY "Admin read listener_connections" ON listener_connections
  FOR SELECT TO authenticated USING (is_admin());

-- Origem da ligação a partir do user-agent.
--   app_android : app Olha Que Duas (expo-audio usa OkHttp → "okhttp/x")
--   mytuner     : myTuner
--   ios         : AppleCoreMedia (app iOS, Safari iOS ou apps iOS de rádio)
--   browser     : browsers (site e diretórios web de rádios)
--   outras_apps : outras apps/players (Dalvik, ExoPlayer, VLC, Roku…)
--   bot         : crawlers e monitores (excluídos das métricas)
CREATE OR REPLACE FUNCTION classify_listener_source(ua TEXT, bot BOOLEAN DEFAULT false)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(bot, false)
      OR COALESCE(ua, '') ~* '(bot|crawler|spider|heritrix|curl/|wget|python-requests|uptime)' THEN 'bot'
    WHEN ua ~* 'mytuner' THEN 'mytuner'
    WHEN ua ~* '^okhttp/' THEN 'app_android'
    WHEN ua ~* '(AppleCoreMedia|CFNetwork)' THEN 'ios'
    WHEN ua ~* '^Mozilla/' THEN 'browser'
    ELSE 'outras_apps'
  END
$$;

CREATE OR REPLACE FUNCTION listener_connections_before_write()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.source := classify_listener_source(NEW.user_agent, NEW.is_bot);
  NEW.updated_at := NOW();
  IF TG_OP = 'UPDATE' THEN
    -- A recolha usa janelas sobrepostas: nunca encurtar uma ligação já vista.
    NEW.connected_until := GREATEST(NEW.connected_until, OLD.connected_until);
    NEW.connected_seconds := GREATEST(NEW.connected_seconds, OLD.connected_seconds);
    NEW.created_at := OLD.created_at;
    -- Não repor o IP de ligações já anonimizadas.
    IF OLD.ip_address IS NULL THEN
      NEW.ip_address := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listener_connections_before_write ON listener_connections;
CREATE TRIGGER trg_listener_connections_before_write
  BEFORE INSERT OR UPDATE ON listener_connections
  FOR EACH ROW EXECUTE FUNCTION listener_connections_before_write();

-- -------------------------------------------------------------
-- 2. Fotografias de ouvintes simultâneos: só administradores leem
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on radio_listener_snapshots" ON radio_listener_snapshots;
DROP POLICY IF EXISTS "Allow service role insert on radio_listener_snapshots" ON radio_listener_snapshots;
DROP POLICY IF EXISTS "Allow all operations on radio_listener_snapshots" ON radio_listener_snapshots;
DROP POLICY IF EXISTS "Admin read radio_listener_snapshots" ON radio_listener_snapshots;
CREATE POLICY "Admin read radio_listener_snapshots" ON radio_listener_snapshots
  FOR SELECT TO authenticated USING (is_admin());

-- -------------------------------------------------------------
-- 3. Remover a analytics v1 (views, crons e RPCs com erros)
-- -------------------------------------------------------------
DO $$
DECLARE j TEXT;
BEGIN
  FOREACH j IN ARRAY ARRAY['refresh-radio-stats-hourly', 'refresh-radio-stats-daily', 'cleanup-old-analytics-data'] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = j) THEN
      PERFORM cron.unschedule(j);
    END IF;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS get_dau_mau_trend(INTEGER);
DROP FUNCTION IF EXISTS get_cohort_retention(INTEGER);
DROP FUNCTION IF EXISTS get_new_vs_returning(INTEGER);
DROP FUNCTION IF EXISTS get_listener_heatmap(INTEGER);
DROP FUNCTION IF EXISTS get_retention_overview();
DROP FUNCTION IF EXISTS get_listeners_by_country(INTEGER);
DROP FUNCTION IF EXISTS get_program_performance(INTEGER);
DROP FUNCTION IF EXISTS get_hourly_stats(INTEGER);
DROP FUNCTION IF EXISTS get_daily_stats(INTEGER);
DROP MATERIALIZED VIEW IF EXISTS radio_stats_hourly;
DROP MATERIALIZED VIEW IF EXISTS radio_stats_daily;

-- listener_sessions / listener_daily_summary deixam de ser escritas e
-- lidas publicamente; são removidas em analytics-v2-cleanup.sql depois
-- do backfill a partir do AzuraCast.
DROP POLICY IF EXISTS "Allow public read on listener_sessions" ON listener_sessions;
DROP POLICY IF EXISTS "Allow service role insert on listener_sessions" ON listener_sessions;
DROP POLICY IF EXISTS "Allow public read on listener_daily_summary" ON listener_daily_summary;
DROP POLICY IF EXISTS "Allow service role insert on listener_daily_summary" ON listener_daily_summary;
DROP POLICY IF EXISTS "Allow service role update on listener_daily_summary" ON listener_daily_summary;

-- -------------------------------------------------------------
-- 4. Retenção: o histórico fica para sempre; os IPs só 90 dias (RGPD)
-- -------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'anonymize-listener-ips') THEN
    PERFORM cron.unschedule('anonymize-listener-ips');
  END IF;
END $$;

SELECT cron.schedule(
  'anonymize-listener-ips',
  '30 3 * * *',
  $$UPDATE listener_connections SET ip_address = NULL
    WHERE ip_address IS NOT NULL AND connected_on < NOW() - INTERVAL '90 days';$$
);

-- -------------------------------------------------------------
-- 5. Funções auxiliares
-- -------------------------------------------------------------

-- Limites de um período de N dias de calendário em Lisboa (hoje incluído).
-- offset_periods = 1 devolve o período anterior com a MESMA duração
-- decorrida (ex.: "hoje até às 11h" compara com "ontem até às 11h").
CREATE OR REPLACE FUNCTION radio_period_bounds(days_back INTEGER, offset_periods INTEGER DEFAULT 0)
RETURNS TABLE(period_start TIMESTAMPTZ, period_end TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$
  WITH cur AS (
    SELECT
      (((NOW() AT TIME ZONE 'Europe/Lisbon')::date - (GREATEST(days_back, 1) - 1))::timestamp
        AT TIME ZONE 'Europe/Lisbon') AS s,
      NOW() AS e
  )
  SELECT
    cur.s - make_interval(days => GREATEST(days_back, 1) * offset_periods),
    cur.e - make_interval(days => GREATEST(days_back, 1) * offset_periods)
  FROM cur
$$;

-- Ligações (sem bots) que se sobrepõem a [p_start, p_end), com os segundos
-- cortados ao intervalo.
CREATE OR REPLACE FUNCTION radio_connections_in_range(p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS TABLE(
  listener_hash TEXT,
  source TEXT,
  country TEXT,
  connected_on TIMESTAMPTZ,
  seconds_in_range NUMERIC,
  full_seconds INTEGER
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.listener_hash,
    c.source,
    c.country,
    c.connected_on,
    GREATEST(0, EXTRACT(EPOCH FROM (LEAST(c.connected_until, p_end) - GREATEST(c.connected_on, p_start))))::NUMERIC,
    c.connected_seconds
  FROM listener_connections c
  WHERE c.connected_on < p_end
    AND c.connected_until > p_start
    AND c.source <> 'bot'
$$;

-- Totais de ligações num intervalo.
--   listeners : ouvintes (hash IP+user-agent) com >= 1 min no intervalo
--   sessions  : ligações com >= 1 min no intervalo
--   short_connections : ligações com < 1 min (cliques e sondas de apps)
CREATE OR REPLACE FUNCTION radio_audience_totals(p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS TABLE(
  listeners BIGINT,
  sessions BIGINT,
  short_connections BIGINT,
  listening_hours NUMERIC,
  avg_session_minutes NUMERIC,
  median_session_minutes NUMERIC,
  top3_share NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH c AS (
    SELECT * FROM radio_connections_in_range(p_start, p_end)
  ),
  per_listener AS (
    SELECT c.listener_hash, SUM(c.seconds_in_range) AS s FROM c GROUP BY c.listener_hash
  ),
  ranked AS (
    SELECT s, ROW_NUMBER() OVER (ORDER BY s DESC) AS rn FROM per_listener
  ),
  sess AS (
    SELECT c.full_seconds FROM c WHERE c.full_seconds >= 60 AND c.connected_on >= p_start
  )
  SELECT
    (SELECT COUNT(*) FROM per_listener WHERE s >= 60),
    (SELECT COUNT(*) FROM c WHERE c.seconds_in_range >= 60),
    (SELECT COUNT(*) FROM c WHERE c.seconds_in_range < 60),
    ROUND(COALESCE((SELECT SUM(c.seconds_in_range) FROM c), 0) / 3600.0, 2),
    ROUND((SELECT AVG(full_seconds) FROM sess) / 60.0, 1),
    ROUND((SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY full_seconds) FROM sess)::NUMERIC / 60.0, 1),
    ROUND((SELECT SUM(s) FILTER (WHERE rn <= 3) / NULLIF(SUM(s), 0) FROM ranked), 3)
$$;

-- Ouvintes simultâneos (fotografias de 5 em 5 min) num intervalo.
CREATE OR REPLACE FUNCTION radio_concurrency_totals(p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS TABLE(
  avg_concurrent NUMERIC,
  peak_concurrent INTEGER,
  peak_at TIMESTAMPTZ,
  pct_time_with_listeners NUMERIC,
  snapshot_coverage NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH s AS (
    SELECT r.listeners_current, r.recorded_at
    FROM radio_listener_snapshots r
    WHERE r.recorded_at >= p_start AND r.recorded_at < p_end
  )
  SELECT
    ROUND(AVG(s.listeners_current), 2),
    MAX(s.listeners_current),
    (SELECT s2.recorded_at FROM s s2 WHERE s2.listeners_current > 0
      ORDER BY s2.listeners_current DESC, s2.recorded_at DESC LIMIT 1),
    ROUND(AVG((s.listeners_current > 0)::INT), 3),
    ROUND(LEAST(1, COUNT(*)::NUMERIC / NULLIF(FLOOR(EXTRACT(EPOCH FROM (p_end - p_start)) / 300), 0)), 3)
  FROM s
$$;

-- -------------------------------------------------------------
-- 6. RPCs usadas pelo painel (separador Audiência)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION radio_audience_overview(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  listeners BIGINT,
  sessions BIGINT,
  short_connections BIGINT,
  listening_hours NUMERIC,
  avg_session_minutes NUMERIC,
  median_session_minutes NUMERIC,
  top3_share NUMERIC,
  avg_concurrent NUMERIC,
  peak_concurrent INTEGER,
  peak_at TIMESTAMPTZ,
  pct_time_with_listeners NUMERIC,
  snapshot_coverage NUMERIC,
  prev_listeners BIGINT,
  prev_sessions BIGINT,
  prev_listening_hours NUMERIC,
  prev_avg_concurrent NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT
    b.period_start, b.period_end,
    t.listeners, t.sessions, t.short_connections, t.listening_hours,
    t.avg_session_minutes, t.median_session_minutes, t.top3_share,
    k.avg_concurrent, k.peak_concurrent, k.peak_at, k.pct_time_with_listeners, k.snapshot_coverage,
    pt.listeners, pt.sessions, pt.listening_hours, pk.avg_concurrent
  FROM radio_period_bounds(days_back, 0) b
  CROSS JOIN radio_period_bounds(days_back, 1) pb
  CROSS JOIN LATERAL radio_audience_totals(b.period_start, b.period_end) t
  CROSS JOIN LATERAL radio_concurrency_totals(b.period_start, b.period_end) k
  CROSS JOIN LATERAL radio_audience_totals(pb.period_start, pb.period_end) pt
  CROSS JOIN LATERAL radio_concurrency_totals(pb.period_start, pb.period_end) pk
$$;

-- Série temporal: por dia (Lisboa) ou, com days_back = 1, por hora.
CREATE OR REPLACE FUNCTION radio_audience_series(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  bucket_start TIMESTAMPTZ,
  bucket_label TEXT,
  listeners BIGINT,
  sessions BIGINT,
  listening_hours NUMERIC,
  avg_concurrent NUMERIC,
  peak_concurrent INTEGER
)
LANGUAGE sql STABLE AS $$
  WITH b AS (
    SELECT * FROM radio_period_bounds(days_back, 0)
  ),
  buckets AS (
    SELECT
      g AS local_start,
      g + CASE WHEN days_back <= 1 THEN INTERVAL '1 hour' ELSE INTERVAL '1 day' END AS local_end
    FROM b,
      generate_series(
        (b.period_start AT TIME ZONE 'Europe/Lisbon'),
        (b.period_end AT TIME ZONE 'Europe/Lisbon'),
        CASE WHEN days_back <= 1 THEN INTERVAL '1 hour' ELSE INTERVAL '1 day' END
      ) AS g
  ),
  bounds AS (
    SELECT
      (local_start AT TIME ZONE 'Europe/Lisbon') AS bs,
      LEAST(NOW(), (local_end AT TIME ZONE 'Europe/Lisbon')) AS be,
      local_start
    FROM buckets
    WHERE (local_start AT TIME ZONE 'Europe/Lisbon') < NOW()
  )
  SELECT
    bounds.bs,
    CASE WHEN days_back <= 1 THEN to_char(bounds.local_start, 'HH24"h"') ELSE to_char(bounds.local_start, 'DD/MM') END,
    t.listeners, t.sessions, t.listening_hours,
    k.avg_concurrent, k.peak_concurrent
  FROM bounds
  CROSS JOIN LATERAL radio_audience_totals(bounds.bs, bounds.be) t
  CROSS JOIN LATERAL radio_concurrency_totals(bounds.bs, bounds.be) k
  ORDER BY bounds.bs
$$;

CREATE OR REPLACE FUNCTION radio_audience_by_source(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  source TEXT,
  listeners BIGINT,
  sessions BIGINT,
  short_connections BIGINT,
  listening_hours NUMERIC,
  avg_session_minutes NUMERIC,
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
    SELECT c.source, c.listener_hash, SUM(c.seconds_in_range) AS s FROM c GROUP BY 1, 2
  ),
  total AS (
    SELECT SUM(c.seconds_in_range) AS t FROM c
  )
  SELECT
    c.source,
    (SELECT COUNT(*) FROM per_listener pl WHERE pl.source = c.source AND pl.s >= 60),
    COUNT(*) FILTER (WHERE c.seconds_in_range >= 60),
    COUNT(*) FILTER (WHERE c.seconds_in_range < 60),
    ROUND(SUM(c.seconds_in_range) / 3600.0, 1),
    ROUND(AVG(c.full_seconds) FILTER (WHERE c.full_seconds >= 60) / 60.0, 1),
    ROUND(SUM(c.seconds_in_range) / NULLIF((SELECT t FROM total), 0), 3)
  FROM c
  GROUP BY c.source
  ORDER BY SUM(c.seconds_in_range) DESC
$$;

CREATE OR REPLACE FUNCTION radio_audience_by_country(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  country TEXT,
  listeners BIGINT,
  listening_hours NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH b AS (
    SELECT * FROM radio_period_bounds(days_back, 0)
  ),
  per_listener AS (
    SELECT COALESCE(x.country, 'Unknown') AS country, x.listener_hash, SUM(x.seconds_in_range) AS s
    FROM b CROSS JOIN LATERAL radio_connections_in_range(b.period_start, b.period_end) x
    GROUP BY 1, 2
  )
  SELECT
    per_listener.country,
    COUNT(*) FILTER (WHERE s >= 60),
    ROUND(SUM(s) / 3600.0, 1)
  FROM per_listener
  GROUP BY per_listener.country
  HAVING COUNT(*) FILTER (WHERE s >= 60) > 0
  ORDER BY 2 DESC, 3 DESC
  LIMIT 20
$$;

-- Média de ouvintes simultâneos por dia da semana x hora (Lisboa).
CREATE OR REPLACE FUNCTION radio_listener_heatmap(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  day_of_week INTEGER,
  hour_of_day INTEGER,
  avg_listeners NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(DOW FROM (r.recorded_at AT TIME ZONE 'Europe/Lisbon'))::INTEGER,
    EXTRACT(HOUR FROM (r.recorded_at AT TIME ZONE 'Europe/Lisbon'))::INTEGER,
    ROUND(AVG(r.listeners_current), 2)
  FROM radio_period_bounds(days_back, 0) b
  JOIN radio_listener_snapshots r
    ON r.recorded_at >= b.period_start AND r.recorded_at < b.period_end
  GROUP BY 1, 2
  ORDER BY 1, 2
$$;

-- "19h", "10h30" → intervalo desde a meia-noite.
CREATE OR REPLACE FUNCTION parse_slot_time(t TEXT)
RETURNS INTERVAL
LANGUAGE sql IMMUTABLE AS $$
  SELECT make_interval(
    hours => (regexp_match(lower(trim(t)), '^(\d{1,2})h(\d{2})?$'))[1]::INTEGER,
    mins => COALESCE((regexp_match(lower(trim(t)), '^(\d{1,2})h(\d{2})?$'))[2]::INTEGER, 0)
  )
$$;

-- Audiência por programa: cada ocorrência real de cada bloco da grelha
-- diária (daily_schedule) e de cada evento semanal (schedule), em Lisboa.
-- Eventos com o mesmo nome e horário em vários dias aparecem numa só linha.
--   avg_listeners   : segundos ouvidos / duração do bloco (inclui sessões curtas)
--   peak_listeners  : pico das fotografias durante o bloco
--   listeners       : ouvintes distintos com >= 1 min no bloco (todas as ocorrências)
-- Usa a grelha ATUAL; mudanças antigas de horário não são refletidas.
CREATE OR REPLACE FUNCTION radio_program_performance(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  program TEXT,
  kind TEXT,
  schedule_label TEXT,
  occurrences BIGINT,
  avg_listeners NUMERIC,
  peak_listeners INTEGER,
  listeners BIGINT,
  listening_hours NUMERIC,
  hours_per_occurrence NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH b AS (
    SELECT * FROM radio_period_bounds(days_back, 0)
  ),
  days AS (
    SELECT d::DATE AS day
    FROM b, generate_series(
      (b.period_start AT TIME ZONE 'Europe/Lisbon')::DATE,
      (b.period_end AT TIME ZONE 'Europe/Lisbon')::DATE,
      INTERVAL '1 day'
    ) AS d
  ),
  slots AS (
    SELECT
      ds.slot_name::TEXT AS program,
      'grelha'::TEXT AS kind,
      NULL::INTEGER AS dow,
      parse_slot_time(split_part(ds.slot_time, '-', 1)) AS t_start,
      parse_slot_time(split_part(ds.slot_time, '-', 2)) AS t_end,
      ds.slot_time::TEXT AS label
    FROM daily_schedule ds
    WHERE ds.is_active
      AND lower(ds.slot_time) ~ '^\s*\d{1,2}h(\d{2})?\s*-\s*\d{1,2}h(\d{2})?\s*$'
    UNION ALL
    SELECT
      e.name::TEXT,
      'evento'::TEXT,
      s.day_of_week,
      CASE WHEN s.is_all_day THEN INTERVAL '0' ELSE s.time::INTERVAL END,
      CASE
        WHEN s.is_all_day THEN INTERVAL '24 hours'
        WHEN s.end_time IS NULL THEN s.time::INTERVAL + INTERVAL '1 hour'
        ELSE s.end_time::INTERVAL
      END,
      CASE WHEN s.is_all_day THEN 'dia todo'
        ELSE to_char(s.time, 'HH24:MI') || COALESCE('-' || to_char(s.end_time, 'HH24:MI'), '')
      END
    FROM schedule s
    JOIN events e ON e.id = s.event_id
    WHERE s.is_active AND e.is_active
  ),
  occurrences AS (
    SELECT
      sl.program, sl.kind, sl.label, EXTRACT(DOW FROM days.day)::INTEGER AS dow,
      ((days.day + sl.t_start) AT TIME ZONE 'Europe/Lisbon') AS os,
      ((days.day + CASE WHEN sl.t_end <= sl.t_start THEN sl.t_end + INTERVAL '24 hours' ELSE sl.t_end END)
        AT TIME ZONE 'Europe/Lisbon') AS oe
    FROM slots sl
    CROSS JOIN days
    WHERE sl.dow IS NULL OR sl.dow = EXTRACT(DOW FROM days.day)::INTEGER
  ),
  per_occurrence AS (
    SELECT
      o.program, o.kind, o.label, o.dow,
      EXTRACT(EPOCH FROM (LEAST(o.oe, NOW()) - o.os)) AS duration_s,
      snap.peak,
      conn.hashes,
      conn.secs
    FROM occurrences o
    CROSS JOIN b
    LEFT JOIN LATERAL (
      SELECT MAX(r.listeners_current) AS peak
      FROM radio_listener_snapshots r
      WHERE r.recorded_at >= o.os AND r.recorded_at < LEAST(o.oe, NOW())
    ) snap ON true
    LEFT JOIN LATERAL (
      SELECT
        ARRAY_AGG(x.h) FILTER (WHERE x.s >= 60) AS hashes,
        SUM(x.s) AS secs
      FROM (
        SELECT r.listener_hash AS h, SUM(r.seconds_in_range) AS s
        FROM radio_connections_in_range(o.os, LEAST(o.oe, NOW())) r
        GROUP BY r.listener_hash
      ) x
    ) conn ON true
    WHERE o.os >= b.period_start AND o.os < NOW()
  )
  SELECT
    p.program,
    p.kind,
    CASE
      WHEN p.kind = 'grelha' OR COUNT(DISTINCT p.dow) = 7 THEN 'Todos os dias ' || p.label
      ELSE (
        SELECT string_agg((ARRAY['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'])[d + 1], ', ' ORDER BY (d + 6) % 7)
        FROM (SELECT DISTINCT p3.dow AS d FROM per_occurrence p3
              WHERE p3.program = p.program AND p3.kind = p.kind AND p3.label = p.label) days_used
      ) || ' ' || p.label
    END,
    COUNT(*),
    ROUND(COALESCE(SUM(p.secs), 0) / NULLIF(SUM(p.duration_s), 0), 2),
    COALESCE(MAX(p.peak), 0),
    (SELECT COUNT(DISTINCT h) FROM per_occurrence p2, unnest(p2.hashes) AS h
      WHERE p2.program = p.program AND p2.kind = p.kind AND p2.label = p.label),
    ROUND(COALESCE(SUM(p.secs), 0) / 3600.0, 1),
    ROUND(COALESCE(SUM(p.secs), 0) / 3600.0 / COUNT(*), 2)
  FROM per_occurrence p
  GROUP BY p.program, p.kind, p.label
  ORDER BY 5 DESC NULLS LAST, 1
$$;

-- Concentração: quem gera as horas ouvidas (IP mascarado).
CREATE OR REPLACE FUNCTION radio_top_listeners(days_back INTEGER DEFAULT 30, max_rows INTEGER DEFAULT 10)
RETURNS TABLE(
  listener_hash TEXT,
  source TEXT,
  ip_masked TEXT,
  city TEXT,
  country TEXT,
  listening_hours NUMERIC,
  sessions BIGINT,
  active_days BIGINT,
  hours_share NUMERIC,
  last_seen TIMESTAMPTZ
)
LANGUAGE sql STABLE AS $$
  WITH b AS (
    SELECT * FROM radio_period_bounds(days_back, 0)
  ),
  c AS (
    SELECT
      lc.listener_hash, lc.source, lc.ip_address, lc.city, lc.country, lc.connected_on, lc.connected_until,
      GREATEST(0, EXTRACT(EPOCH FROM (LEAST(lc.connected_until, b.period_end) - GREATEST(lc.connected_on, b.period_start)))) AS s
    FROM b
    JOIN listener_connections lc
      ON lc.connected_on < b.period_end AND lc.connected_until > b.period_start AND lc.source <> 'bot'
  ),
  total AS (
    SELECT SUM(s) AS t FROM c
  )
  SELECT
    c.listener_hash,
    MAX(c.source),
    CASE
      WHEN MAX(c.ip_address) IS NULL THEN NULL
      WHEN MAX(c.ip_address) ~ '^\d+\.\d+\.\d+\.\d+$' THEN regexp_replace(MAX(c.ip_address), '\.\d+\.\d+$', '.x.x')
      ELSE split_part(MAX(c.ip_address), ':', 1) || ':' || split_part(MAX(c.ip_address), ':', 2) || ':…'
    END,
    MAX(c.city),
    MAX(c.country),
    ROUND(SUM(c.s) / 3600.0, 1),
    COUNT(*) FILTER (WHERE c.s >= 60),
    COUNT(DISTINCT (c.connected_on AT TIME ZONE 'Europe/Lisbon')::DATE),
    ROUND(SUM(c.s) / NULLIF((SELECT t FROM total), 0), 3),
    MAX(c.connected_until)
  FROM c
  GROUP BY c.listener_hash
  HAVING SUM(c.s) >= 60
  ORDER BY SUM(c.s) DESC
  LIMIT GREATEST(max_rows, 1)
$$;

-- -------------------------------------------------------------
-- 7. Permissões: só utilizadores autenticados executam as RPCs
--    (e o RLS só devolve dados a administradores)
-- -------------------------------------------------------------
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'radio_period_bounds(integer, integer)',
    'radio_connections_in_range(timestamptz, timestamptz)',
    'radio_audience_totals(timestamptz, timestamptz)',
    'radio_concurrency_totals(timestamptz, timestamptz)',
    'radio_audience_overview(integer)',
    'radio_audience_series(integer)',
    'radio_audience_by_source(integer)',
    'radio_audience_by_country(integer)',
    'radio_listener_heatmap(integer)',
    'radio_program_performance(integer)',
    'radio_top_listeners(integer, integer)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END $$;
