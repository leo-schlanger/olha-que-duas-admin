-- =============================================================
-- Eventos com data (emissões únicas)
--
-- A tabela `schedule` é a grelha SEMANAL (repete todas as semanas).
-- `schedule_dates` guarda emissões num dia concreto (ex.: uma entrevista
-- a 13/09/2026 às 19h). Tabela separada de propósito: as versões antigas
-- da app leem `schedule` sem conhecer datas e mostrariam um evento único
-- todas as semanas; assim simplesmente não o veem.
--
-- Datas e horas em hora de Lisboa. Executar depois de analytics-v2.sql.
-- =============================================================

CREATE TABLE IF NOT EXISTS schedule_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  time TIME NOT NULL DEFAULT '00:00',
  end_time TIME,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT schedule_dates_event_date_time_key UNIQUE (event_id, event_date, time)
);

CREATE INDEX IF NOT EXISTS idx_schedule_dates_date ON schedule_dates(event_date);

ALTER TABLE schedule_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read schedule_dates" ON schedule_dates;
CREATE POLICY "Public read schedule_dates" ON schedule_dates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write schedule_dates" ON schedule_dates;
CREATE POLICY "Admin write schedule_dates" ON schedule_dates
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Audiência por programa passa a incluir as emissões com data
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
$$;
