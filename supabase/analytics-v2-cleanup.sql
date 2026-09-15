-- =============================================================
-- Analytics v2: limpeza final
-- Executar DEPOIS de confirmar o backfill de listener_connections a partir
-- do AzuraCast (radio-snapshot-cron com backfill_from/backfill_to).
--
-- listener_sessions tinha ~93% de linhas duplicadas (a mesma sessão gravada
-- a cada 5 min) e só apanhava quem estava ligado no momento da fotografia.
-- listener_connections tem o histórico completo e substitui-a.
-- =============================================================

DROP TABLE IF EXISTS listener_daily_summary;
DROP TABLE IF EXISTS listener_sessions;
