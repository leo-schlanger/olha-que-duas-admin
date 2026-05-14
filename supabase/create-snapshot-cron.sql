-- Enable required extensions (already enabled on Supabase hosted projects)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the radio-snapshot-cron Edge Function every 5 minutes
-- This ensures 24/7 data collection independent of the admin panel being open
SELECT cron.schedule(
  'radio-snapshot-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/radio-snapshot-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- NOTE: If the above current_setting approach doesn't work in your environment,
-- you can set up the cron via the Supabase Dashboard:
--
-- 1. Go to Database > Extensions and enable pg_cron and pg_net
-- 2. Go to Database > Cron Jobs
-- 3. Create a new cron job with:
--    - Schedule: */5 * * * *
--    - Command: SELECT net.http_post(
--        url := 'YOUR_SUPABASE_URL/functions/v1/radio-snapshot-cron',
--        headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
--        body := '{}'::jsonb
--      );
