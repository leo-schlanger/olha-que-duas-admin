-- =============================================================
-- Finanças: clientes, receitas/despesas, recorrências, equipa e
-- distribuição do resultado.
--
-- Acesso: administradores com admin_users.can_finance = true (função
-- is_finance()). Por defeito todos os admins, incluindo os novos, têm acesso;
-- para retirar a alguém: can_finance = false.
--
-- Recorrências: fin_generate_recurring() cria os lançamentos previstos
-- (status 'pending') até N dias à frente. Corre todos os dias via pg_cron
-- dentro do Supabase e também quando o painel abre — não depende do Vercel.
--
-- Retirar acesso a alguém:
--   UPDATE admin_users SET can_finance = false WHERE lower(email) = lower('x@y.com');
-- =============================================================

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS can_finance BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admin_users ALTER COLUMN can_finance SET DEFAULT TRUE;

CREATE OR REPLACE FUNCTION is_finance()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', '') = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND can_finance
    )
$$;

REVOKE ALL ON FUNCTION is_finance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_finance() TO anon, authenticated, service_role;

-- -------------------------------------------------------------
-- Tabelas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#9ca3af',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS fin_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nif TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entradas/saídas que se repetem (cliente semanal, subscrição de ferramenta...).
-- A data de cada ocorrência é start_date + n * período (n = generated_count),
-- assim um mensal no dia 31 não "escorrega" para dia 28.
CREATE TABLE IF NOT EXISTS fin_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  generated_count INTEGER NOT NULL DEFAULT 0,
  client_id UUID REFERENCES fin_clients(id) ON DELETE SET NULL,
  category_id UUID REFERENCES fin_categories(id) ON DELETE SET NULL,
  method TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  tx_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid')),
  paid_at DATE,
  method TEXT,
  invoice_ref TEXT,
  receipt_path TEXT,
  notes TEXT,
  client_id UUID REFERENCES fin_clients(id) ON DELETE SET NULL,
  category_id UUID REFERENCES fin_categories(id) ON DELETE SET NULL,
  recurrence_id UUID REFERENCES fin_recurrences(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recurrence_id, tx_date)
);

CREATE INDEX IF NOT EXISTS fin_transactions_date_idx ON fin_transactions (tx_date);

CREATE TABLE IF NOT EXISTS fin_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  share_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (share_percent >= 0 AND share_percent <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pagamentos feitos a cada membro, por mês (period = 1.º dia do mês).
CREATE TABLE IF NOT EXISTS fin_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES fin_members(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Linha única com as definições (reserva para caixa/impostos antes de dividir).
CREATE TABLE IF NOT EXISTS fin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  reserve_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (reserve_percent >= 0 AND reserve_percent <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO fin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO fin_categories (name, kind, color) VALUES
  ('Patrocínio', 'income', '#16a34a'),
  ('Publicidade', 'income', '#0d9488'),
  ('Serviços', 'income', '#2563eb'),
  ('Outras receitas', 'income', '#64748b'),
  ('Ferramentas e software', 'expense', '#7c3aed'),
  ('Servidores e infraestrutura', 'expense', '#db2777'),
  ('Marketing', 'expense', '#ea580c'),
  ('Equipamento', 'expense', '#ca8a04'),
  ('Taxas e impostos', 'expense', '#dc2626'),
  ('Outras despesas', 'expense', '#64748b')
ON CONFLICT (kind, name) DO NOTHING;

-- -------------------------------------------------------------
-- RLS: tudo só para is_finance()
-- -------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['fin_categories', 'fin_clients', 'fin_recurrences',
                           'fin_transactions', 'fin_members', 'fin_payouts', 'fin_settings']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Finance all" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "Finance all" ON %I FOR ALL TO authenticated USING (is_finance()) WITH CHECK (is_finance())',
      t
    );
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;

-- -------------------------------------------------------------
-- Geração dos lançamentos recorrentes
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fin_generate_recurring(horizon_days INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r fin_recurrences%ROWTYPE;
  step INTERVAL;
  d DATE;
  n INTEGER;
  created INTEGER := 0;
  limit_date DATE := (NOW() AT TIME ZONE 'Europe/Lisbon')::date + horizon_days;
BEGIN
  -- Chamado pelo painel: só quem tem acesso às finanças. Pelo pg_cron não há JWT.
  IF auth.jwt() IS NOT NULL AND NOT is_finance() THEN
    RAISE EXCEPTION 'Sem acesso às finanças';
  END IF;

  FOR r IN SELECT * FROM fin_recurrences WHERE is_active FOR UPDATE LOOP
    step := CASE r.frequency
      WHEN 'weekly' THEN INTERVAL '7 days'
      WHEN 'monthly' THEN INTERVAL '1 month'
      ELSE INTERVAL '1 year'
    END;
    n := r.generated_count;

    -- Limite de segurança: no máximo 400 ocorrências por chamada.
    FOR i IN 1..400 LOOP
      d := (r.start_date + n * step)::date;
      EXIT WHEN d > limit_date OR (r.end_date IS NOT NULL AND d > r.end_date);

      INSERT INTO fin_transactions
        (kind, tx_date, amount, description, status, method, client_id, category_id, recurrence_id)
      VALUES
        (r.kind, d, r.amount, r.description, 'pending', r.method, r.client_id, r.category_id, r.id)
      ON CONFLICT (recurrence_id, tx_date) DO NOTHING;

      IF FOUND THEN
        created := created + 1;
      END IF;
      n := n + 1;
    END LOOP;

    IF n <> r.generated_count THEN
      UPDATE fin_recurrences SET generated_count = n WHERE id = r.id;
    END IF;
  END LOOP;

  RETURN created;
END;
$$;

REVOKE ALL ON FUNCTION fin_generate_recurring(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION fin_generate_recurring(INTEGER) TO authenticated, service_role;

-- Todos os dias às 05:15 UTC, gera os previstos da semana seguinte.
SELECT cron.unschedule('finance-recurring-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'finance-recurring-daily');
SELECT cron.schedule('finance-recurring-daily', '15 5 * * *', $$SELECT public.fin_generate_recurring(7)$$);

-- -------------------------------------------------------------
-- Storage: comprovativos e faturas (bucket privado)
-- -------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('finance-receipts', 'finance-receipts', false, 10485760)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Finance read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance insert receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Finance delete receipts" ON storage.objects;

CREATE POLICY "Finance read receipts" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'finance-receipts' AND public.is_finance());
CREATE POLICY "Finance insert receipts" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'finance-receipts' AND public.is_finance());
CREATE POLICY "Finance update receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'finance-receipts' AND public.is_finance())
  WITH CHECK (bucket_id = 'finance-receipts' AND public.is_finance());
CREATE POLICY "Finance delete receipts" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'finance-receipts' AND public.is_finance());
