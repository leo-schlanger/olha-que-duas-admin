-- =============================================================
-- Finanças: histórico de alterações (quem fez o quê e quando)
--
-- Um trigger regista em fin_activity cada inserção, alteração e remoção
-- em lançamentos, recorrências, clientes, equipa, pagamentos à equipa e
-- definições. Só leitura no painel (ninguém edita o histórico).
-- Requer finance.sql.
-- =============================================================

CREATE TABLE IF NOT EXISTS fin_activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_email TEXT,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  row_id TEXT,
  old_data JSONB,
  new_data JSONB
);

CREATE INDEX IF NOT EXISTS fin_activity_at_idx ON fin_activity (at DESC);

ALTER TABLE fin_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance read activity" ON fin_activity;
CREATE POLICY "Finance read activity" ON fin_activity
  FOR SELECT TO authenticated USING (is_finance());
REVOKE ALL ON fin_activity FROM anon;
-- Sem políticas de escrita: só o trigger (SECURITY DEFINER) escreve.

CREATE OR REPLACE FUNCTION fin_log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_j JSONB := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  new_j JSONB := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
BEGIN
  -- Alterações sem efeito (ex.: o gerador só a avançar o contador) não entram.
  IF TG_OP = 'UPDATE' AND old_j - 'generated_count' = new_j - 'generated_count' THEN
    RETURN NEW;
  END IF;

  INSERT INTO fin_activity (user_email, table_name, action, row_id, old_data, new_data)
  VALUES (
    -- NULL = automático (pg_cron / gerador de recorrências)
    NULLIF(auth.jwt() ->> 'email', ''),
    TG_TABLE_NAME,
    lower(TG_OP),
    COALESCE(new_j ->> 'id', old_j ->> 'id'),
    old_j,
    new_j
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['fin_transactions', 'fin_recurrences', 'fin_clients',
                           'fin_members', 'fin_payouts', 'fin_settings', 'fin_categories']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS fin_activity_log ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER fin_activity_log AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION fin_log_activity()',
      t
    );
  END LOOP;
END $$;
