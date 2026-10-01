-- =============================================================
-- Finanças: relatório mensal por email (edge function finance-monthly-report)
--
-- Nos dias 1–3 de cada mês às 07:00 UTC o pg_cron chama a função, que envia o
-- relatório do mês anterior UMA vez (report_last_period); os dias 2 e 3 só
-- servem de nova tentativa se o envio do dia 1 falhar.
--
-- O segredo partilhado com a função fica no Vault (nome fin_report_secret) e
-- nos segredos da função (FIN_REPORT_SECRET). Criar/rodar o segredo:
--   SELECT vault.create_secret('<valor>', 'fin_report_secret');   -- 1.ª vez
--   SELECT vault.update_secret(id, '<valor>') FROM vault.secrets WHERE name = 'fin_report_secret';
--   npx supabase secrets set FIN_REPORT_SECRET=<valor>
-- Requer finance.sql.
-- =============================================================

ALTER TABLE fin_settings
  ADD COLUMN IF NOT EXISTS report_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- NULL/vazio = emails dos membros ativos da equipa
  ADD COLUMN IF NOT EXISTS report_recipients TEXT[],
  ADD COLUMN IF NOT EXISTS report_last_period TEXT,
  ADD COLUMN IF NOT EXISTS report_last_sent_at TIMESTAMPTZ;

SELECT cron.unschedule('finance-monthly-report')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'finance-monthly-report');

SELECT cron.schedule(
  'finance-monthly-report',
  '0 7 1-3 * *',
  $$
  SELECT net.http_post(
    url := 'https://jjifjbdfpvgeseqbjpkg.supabase.co/functions/v1/finance-monthly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'fin_report_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
