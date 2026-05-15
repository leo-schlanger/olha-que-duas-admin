-- =============================================================
-- FASE 2: RPCs de Retenção e Audiência
-- Execute este script no Supabase Dashboard > SQL Editor
-- APÓS executar add-listener-sessions-and-views.sql
-- =============================================================

-- 1. DAU/MAU Ratio (Stickiness)
-- Retorna o ratio dos últimos 30 dias, dia a dia
CREATE OR REPLACE FUNCTION get_dau_mau_trend(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  day DATE,
  dau BIGINT,
  mau BIGINT,
  ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.day::DATE,
    (SELECT COUNT(DISTINCT ls.listener_hash)
     FROM listener_sessions ls
     WHERE ls.connected_at::DATE = d.day::DATE
    ) AS dau,
    (SELECT COUNT(DISTINCT ls.listener_hash)
     FROM listener_sessions ls
     WHERE ls.connected_at::DATE BETWEEN d.day::DATE - INTERVAL '30 days' AND d.day::DATE
    ) AS mau,
    CASE
      WHEN (SELECT COUNT(DISTINCT ls.listener_hash)
            FROM listener_sessions ls
            WHERE ls.connected_at::DATE BETWEEN d.day::DATE - INTERVAL '30 days' AND d.day::DATE) > 0
      THEN ROUND(
        (SELECT COUNT(DISTINCT ls.listener_hash)
         FROM listener_sessions ls
         WHERE ls.connected_at::DATE = d.day::DATE)::NUMERIC /
        (SELECT COUNT(DISTINCT ls.listener_hash)
         FROM listener_sessions ls
         WHERE ls.connected_at::DATE BETWEEN d.day::DATE - INTERVAL '30 days' AND d.day::DATE)::NUMERIC,
        4
      )
      ELSE 0
    END AS ratio
  FROM generate_series(
    CURRENT_DATE - (days_back || ' days')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) AS d(day)
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql;

-- 2. Cohort Retention (semanas)
-- Retorna tabela de retenção por cohort semanal
CREATE OR REPLACE FUNCTION get_cohort_retention(weeks_back INTEGER DEFAULT 8)
RETURNS TABLE(
  cohort_week DATE,
  week_number INTEGER,
  cohort_size BIGINT,
  retained BIGINT,
  retention_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT
      listener_hash,
      DATE_TRUNC('week', MIN(connected_at))::DATE AS first_week
    FROM listener_sessions
    WHERE connected_at >= CURRENT_DATE - (weeks_back * 7 || ' days')::INTERVAL
    GROUP BY listener_hash
  ),
  cohort_sizes AS (
    SELECT first_week, COUNT(*) AS size
    FROM cohorts
    GROUP BY first_week
  ),
  activity AS (
    SELECT DISTINCT
      c.listener_hash,
      c.first_week,
      DATE_TRUNC('week', ls.connected_at)::DATE AS active_week
    FROM cohorts c
    JOIN listener_sessions ls ON ls.listener_hash = c.listener_hash
    WHERE ls.connected_at >= CURRENT_DATE - (weeks_back * 7 || ' days')::INTERVAL
  )
  SELECT
    a.first_week AS cohort_week,
    ((a.active_week - a.first_week) / 7)::INTEGER AS week_number,
    cs.size AS cohort_size,
    COUNT(DISTINCT a.listener_hash) AS retained,
    ROUND(COUNT(DISTINCT a.listener_hash)::NUMERIC / cs.size::NUMERIC, 4) AS retention_rate
  FROM activity a
  JOIN cohort_sizes cs ON cs.first_week = a.first_week
  GROUP BY a.first_week, ((a.active_week - a.first_week) / 7)::INTEGER, cs.size
  ORDER BY a.first_week, week_number;
END;
$$ LANGUAGE plpgsql;

-- 3. New vs Returning listeners por dia
CREATE OR REPLACE FUNCTION get_new_vs_returning(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  day DATE,
  new_listeners BIGINT,
  returning_listeners BIGINT,
  total_listeners BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH first_seen AS (
    SELECT
      listener_hash,
      MIN(connected_at)::DATE AS first_date
    FROM listener_sessions
    GROUP BY listener_hash
  ),
  daily_activity AS (
    SELECT DISTINCT
      ls.listener_hash,
      ls.connected_at::DATE AS active_date,
      fs.first_date
    FROM listener_sessions ls
    JOIN first_seen fs ON fs.listener_hash = ls.listener_hash
    WHERE ls.connected_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  )
  SELECT
    d.day::DATE,
    COUNT(DISTINCT da.listener_hash) FILTER (WHERE da.first_date = d.day::DATE) AS new_listeners,
    COUNT(DISTINCT da.listener_hash) FILTER (WHERE da.first_date < d.day::DATE) AS returning_listeners,
    COUNT(DISTINCT da.listener_hash) AS total_listeners
  FROM generate_series(
    CURRENT_DATE - (days_back || ' days')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) AS d(day)
  LEFT JOIN daily_activity da ON da.active_date = d.day::DATE
  GROUP BY d.day
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql;

-- 4. Heatmap semanal (dia da semana x hora do dia)
CREATE OR REPLACE FUNCTION get_listener_heatmap(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  day_of_week INTEGER,
  hour_of_day INTEGER,
  avg_listeners NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DOW FROM rls.recorded_at)::INTEGER AS day_of_week,
    EXTRACT(HOUR FROM rls.recorded_at)::INTEGER AS hour_of_day,
    ROUND(AVG(rls.listeners_current), 1) AS avg_listeners
  FROM radio_listener_snapshots rls
  WHERE rls.recorded_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY
    EXTRACT(DOW FROM rls.recorded_at)::INTEGER,
    EXTRACT(HOUR FROM rls.recorded_at)::INTEGER
  ORDER BY day_of_week, hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- 5. Estatísticas gerais de retenção
CREATE OR REPLACE FUNCTION get_retention_overview()
RETURNS TABLE(
  total_unique_listeners BIGINT,
  listeners_today BIGINT,
  listeners_this_week BIGINT,
  listeners_this_month BIGINT,
  new_today BIGINT,
  returning_today BIGINT,
  avg_sessions_per_listener NUMERIC,
  avg_session_duration_seconds NUMERIC,
  churn_rate_30d NUMERIC,
  dau_mau_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT listener_hash) AS total_unique,
      COUNT(DISTINCT listener_hash) FILTER (
        WHERE connected_at::DATE = CURRENT_DATE
      ) AS today_count,
      COUNT(DISTINCT listener_hash) FILTER (
        WHERE connected_at >= CURRENT_DATE - INTERVAL '7 days'
      ) AS week_count,
      COUNT(DISTINCT listener_hash) FILTER (
        WHERE connected_at >= CURRENT_DATE - INTERVAL '30 days'
      ) AS month_count,
      COUNT(DISTINCT listener_hash) FILTER (
        WHERE is_first_session = true AND connected_at::DATE = CURRENT_DATE
      ) AS new_today_count,
      COUNT(DISTINCT listener_hash) FILTER (
        WHERE is_first_session = false AND connected_at::DATE = CURRENT_DATE
      ) AS returning_today_count,
      ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT listener_hash), 0), 2) AS avg_sessions,
      ROUND(AVG(NULLIF(connected_seconds, 0))::NUMERIC, 0) AS avg_duration
    FROM listener_sessions
  ),
  churn AS (
    SELECT
      COUNT(DISTINCT listener_hash) FILTER (
        WHERE connected_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'
        AND listener_hash NOT IN (
          SELECT DISTINCT listener_hash FROM listener_sessions
          WHERE connected_at >= CURRENT_DATE - INTERVAL '30 days'
        )
      )::NUMERIC /
      NULLIF(COUNT(DISTINCT listener_hash) FILTER (
        WHERE connected_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days'
      ), 0) AS churn
    FROM listener_sessions
  )
  SELECT
    s.total_unique,
    s.today_count,
    s.week_count,
    s.month_count,
    s.new_today_count,
    s.returning_today_count,
    s.avg_sessions,
    s.avg_duration,
    COALESCE(ROUND(c.churn, 4), 0::NUMERIC),
    CASE WHEN s.month_count > 0
      THEN ROUND(s.today_count::NUMERIC / s.month_count::NUMERIC, 4)
      ELSE 0::NUMERIC
    END
  FROM stats s, churn c;
END;
$$ LANGUAGE plpgsql;

-- 6. Top países por ouvintes únicos
CREATE OR REPLACE FUNCTION get_listeners_by_country(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  country TEXT,
  unique_listeners BIGINT,
  total_sessions BIGINT,
  avg_duration_seconds NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ls.country, 'Unknown') AS country,
    COUNT(DISTINCT ls.listener_hash) AS unique_listeners,
    COUNT(*) AS total_sessions,
    ROUND(AVG(NULLIF(ls.connected_seconds, 0))::NUMERIC, 0) AS avg_duration_seconds
  FROM listener_sessions ls
  WHERE ls.connected_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY COALESCE(ls.country, 'Unknown')
  ORDER BY unique_listeners DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 7. Correlação programa x ouvintes
CREATE OR REPLACE FUNCTION get_program_performance(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  slot_name TEXT,
  period_label TEXT,
  slot_time TEXT,
  avg_listeners NUMERIC,
  peak_listeners INTEGER,
  sample_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.slot_name,
    ds.period_label,
    ds.slot_time,
    ROUND(AVG(rls.listeners_current), 1) AS avg_listeners,
    MAX(rls.listeners_current) AS peak_listeners,
    COUNT(*) AS sample_count
  FROM daily_schedule ds
  CROSS JOIN LATERAL (
    -- Parse slot_time to get hour (handles formats like '07h', '10h30')
    SELECT
      CAST(SPLIT_PART(REPLACE(REPLACE(ds.slot_time, 'h', ':'), ':', ':'), ':', 1) AS INTEGER) AS slot_hour
  ) parsed
  JOIN radio_listener_snapshots rls ON
    EXTRACT(HOUR FROM rls.recorded_at) = parsed.slot_hour
    AND rls.recorded_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    AND rls.is_online = true
  WHERE ds.is_active = true
  GROUP BY ds.slot_name, ds.period_label, ds.slot_time, ds.sort_order
  ORDER BY ds.sort_order;
END;
$$ LANGUAGE plpgsql;

-- 8. Tendência de ouvintes usando views materializadas (performance)
CREATE OR REPLACE FUNCTION get_hourly_stats(hours_back INTEGER DEFAULT 168)
RETURNS TABLE(
  hour TIMESTAMPTZ,
  avg_listeners INTEGER,
  peak_listeners INTEGER,
  tlh NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rsh.hour,
    rsh.avg_listeners,
    rsh.peak_listeners,
    rsh.tlh
  FROM radio_stats_hourly rsh
  WHERE rsh.hour >= NOW() - (hours_back || ' hours')::INTERVAL
  ORDER BY rsh.hour;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_daily_stats(days_back INTEGER DEFAULT 90)
RETURNS TABLE(
  day DATE,
  avg_listeners INTEGER,
  peak_listeners INTEGER,
  peak_unique INTEGER,
  avg_listen_time INTEGER,
  tlh NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rsd.day,
    rsd.avg_listeners,
    rsd.peak_listeners,
    rsd.peak_unique,
    rsd.avg_listen_time,
    rsd.tlh
  FROM radio_stats_daily rsd
  WHERE rsd.day >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  ORDER BY rsd.day;
END;
$$ LANGUAGE plpgsql;
