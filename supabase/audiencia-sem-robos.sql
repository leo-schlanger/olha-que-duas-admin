-- =============================================================
-- Audiência sem robôs nas fotografias (21/11/2026)
--
-- As fotografias de 5 em 5 min (radio_listener_snapshots.listeners_current)
-- contam TODAS as ligações do AzuraCast, incluindo robôs. Desde 01/11/2026
-- uma ligação curl/8.5.0 (IP 46.225.17.x, Nuremberga) fica ligada 24 h por
-- dia: a média de ouvintes simultâneos passava de ~0,12 para ~1,1 e o
-- «tempo com alguém a ouvir» marcava 100 %. As métricas de ligações já
-- excluíam os robôs; agora as de fotografias também.
--
-- Correção: ouvintes da fotografia − robôs ligados nesse instante (hash
-- distinto, folga de 30 s para a última atualização e para as religações).
-- Reconciliação em prod (60 dias, 17 276 fotografias): 99,8 % iguais à
-- contagem de ligações não-robô vivas no mesmo instante.
--
-- Só CREATE OR REPLACE com as mesmas assinaturas + funções novas.
-- SECURITY INVOKER: o RLS (is_admin) continua a decidir quem vê.
-- radio_program_performance parte da definição de PRODUÇÃO (a de
-- schedule-dates.sql, com as emissões com data); só muda o pico.
-- =============================================================

-- 1. Fotografias sem robôs
CREATE OR REPLACE FUNCTION radio_human_snapshots(p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS TABLE(recorded_at TIMESTAMPTZ, listeners INTEGER, bots INTEGER)
LANGUAGE sql STABLE AS $$
  -- The few bot connections of the range first; a lateral straight on
  -- listener_connections rescans the table for every snapshot (3 s at 90 days).
  WITH bots AS MATERIALIZED (
    SELECT c.listener_hash, c.connected_on, c.connected_until
    FROM listener_connections c
    WHERE c.source = 'bot'
      AND c.connected_on <= p_end + INTERVAL '30 seconds'
      AND c.connected_until >= p_start - INTERVAL '30 seconds'
  )
  SELECT
    r.recorded_at,
    GREATEST(0, r.listeners_current - COALESCE(bt.n, 0))::INTEGER,
    COALESCE(bt.n, 0)::INTEGER
  FROM radio_listener_snapshots r
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT b.listener_hash) AS n
    FROM bots b
    WHERE b.connected_on <= r.recorded_at + INTERVAL '30 seconds'
      AND b.connected_until >= r.recorded_at - INTERVAL '30 seconds'
  ) bt ON true
  WHERE r.recorded_at >= p_start AND r.recorded_at < p_end
$$;

-- 2. Simultâneos (mesmas colunas de antes)
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
    SELECT h.listeners AS listeners_current, h.recorded_at
    FROM radio_human_snapshots(p_start, p_end) h
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

-- 3. Mapa de calor dia × hora (Lisboa)
CREATE OR REPLACE FUNCTION radio_listener_heatmap(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  day_of_week INTEGER,
  hour_of_day INTEGER,
  avg_listeners NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(DOW FROM (h.recorded_at AT TIME ZONE 'Europe/Lisbon'))::INTEGER,
    EXTRACT(HOUR FROM (h.recorded_at AT TIME ZONE 'Europe/Lisbon'))::INTEGER,
    ROUND(AVG(h.listeners), 2)
  FROM radio_period_bounds(days_back, 0) b
  CROSS JOIN LATERAL radio_human_snapshots(b.period_start, b.period_end) h
  GROUP BY 1, 2
  ORDER BY 1, 2
$$;

-- 4. Audiência por programa (pico sem robôs)
CREATE OR REPLACE FUNCTION radio_program_performance(days_back integer DEFAULT 30)
 RETURNS TABLE(program text, kind text, schedule_label text, occurrences bigint, avg_listeners numeric, peak_listeners integer, listeners bigint, listening_hours numeric, hours_per_occurrence numeric)
 LANGUAGE sql
 STABLE
AS $function$
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
    UNION ALL
    -- Eventos com data (emissões únicas): uma linha por emissão
    SELECT
      e.name::TEXT,
      'evento'::TEXT,
      to_char(sd.event_date, 'DD/MM/YYYY') || ' ' || CASE WHEN sd.is_all_day THEN 'dia todo'
        ELSE to_char(sd.time, 'HH24:MI') || COALESCE('-' || to_char(sd.end_time, 'HH24:MI'), '')
      END,
      EXTRACT(DOW FROM sd.event_date)::INTEGER,
      ((sd.event_date + CASE WHEN sd.is_all_day THEN INTERVAL '0' ELSE sd.time::INTERVAL END)
        AT TIME ZONE 'Europe/Lisbon'),
      ((sd.event_date + CASE
          WHEN sd.is_all_day THEN INTERVAL '24 hours'
          WHEN sd.end_time IS NULL THEN sd.time::INTERVAL + INTERVAL '1 hour'
          WHEN sd.end_time <= sd.time THEN sd.end_time::INTERVAL + INTERVAL '24 hours'
          ELSE sd.end_time::INTERVAL
        END) AT TIME ZONE 'Europe/Lisbon')
    FROM schedule_dates sd
    JOIN events e ON e.id = sd.event_id
    CROSS JOIN b
    WHERE sd.is_active
      AND sd.event_date BETWEEN (b.period_start AT TIME ZONE 'Europe/Lisbon')::DATE
                            AND (b.period_end AT TIME ZONE 'Europe/Lisbon')::DATE
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
      SELECT MAX(r.listeners) AS peak
      FROM radio_human_snapshots(o.os, LEAST(o.oe, NOW())) r
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
      -- Evento com data: o rótulo já traz a data
      WHEN p.label ~ '^\d{2}/\d{2}/\d{4} ' THEN p.label
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
$function$;

-- 5. Leituras simples para o resumo e a retenção (uma linha)
--   sessions_*          : sessões >= 1 min iniciadas no período, por duração
--   returning_listeners : ouvintes do período que também ouviram (>= 1 min) no anterior
--   multi_day_listeners : ouvintes com escuta em 2 ou mais dias (Lisboa)
--   peak_snapshots      : momentos distintos com o valor do pico (fotografias
--                         seguidas no pico contam como um só momento)
--   prev_complete       : o período anterior está todo dentro do histórico de ligações
CREATE OR REPLACE FUNCTION radio_audience_insights(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  sessions_under_5 BIGINT,
  sessions_5_15 BIGINT,
  sessions_15_60 BIGINT,
  sessions_over_60 BIGINT,
  returning_listeners BIGINT,
  multi_day_listeners BIGINT,
  peak_snapshots BIGINT,
  history_start TIMESTAMPTZ,
  prev_complete BOOLEAN
)
LANGUAGE sql STABLE AS $$
  WITH b AS (SELECT * FROM radio_period_bounds(days_back, 0)),
  pb AS (SELECT * FROM radio_period_bounds(days_back, 1)),
  cur AS (SELECT x.* FROM b CROSS JOIN LATERAL radio_connections_in_range(b.period_start, b.period_end) x),
  prev AS (SELECT x.* FROM pb CROSS JOIN LATERAL radio_connections_in_range(pb.period_start, pb.period_end) x),
  cur_l AS (SELECT listener_hash FROM cur GROUP BY 1 HAVING SUM(seconds_in_range) >= 60),
  prev_l AS (SELECT listener_hash FROM prev GROUP BY 1 HAVING SUM(seconds_in_range) >= 60),
  sess AS (SELECT cur.full_seconds FROM cur, b WHERE cur.full_seconds >= 60 AND cur.connected_on >= b.period_start),
  days AS (
    SELECT cur.listener_hash, COUNT(DISTINCT (cur.connected_on AT TIME ZONE 'Europe/Lisbon')::DATE) AS n
    FROM cur WHERE cur.seconds_in_range >= 60 GROUP BY 1
  ),
  snaps AS (
    SELECT h.listeners, LAG(h.listeners) OVER (ORDER BY h.recorded_at) AS prev
    FROM b CROSS JOIN LATERAL radio_human_snapshots(b.period_start, b.period_end) h
  ),
  hist AS (SELECT MIN(connected_on) AS s FROM listener_connections)
  SELECT
    (SELECT COUNT(*) FROM sess WHERE full_seconds < 300),
    (SELECT COUNT(*) FROM sess WHERE full_seconds >= 300 AND full_seconds < 900),
    (SELECT COUNT(*) FROM sess WHERE full_seconds >= 900 AND full_seconds < 3600),
    (SELECT COUNT(*) FROM sess WHERE full_seconds >= 3600),
    (SELECT COUNT(*) FROM cur_l WHERE listener_hash IN (SELECT listener_hash FROM prev_l)),
    (SELECT COUNT(*) FROM days WHERE n >= 2),
    (SELECT COUNT(*) FROM snaps
      WHERE listeners > 0 AND listeners = (SELECT MAX(listeners) FROM snaps)
        AND prev IS DISTINCT FROM listeners),
    (SELECT s FROM hist),
    COALESCE((SELECT s FROM hist) <= (SELECT period_start FROM pb), false)
$$;

-- 6. Permissões (só autenticados; o RLS só devolve dados a administradores)
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'radio_human_snapshots(timestamptz, timestamptz)',
    'radio_concurrency_totals(timestamptz, timestamptz)',
    'radio_listener_heatmap(integer)',
    'radio_program_performance(integer)',
    'radio_audience_insights(integer)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END $$;
