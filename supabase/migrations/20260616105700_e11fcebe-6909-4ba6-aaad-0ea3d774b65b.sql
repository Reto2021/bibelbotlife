-- Generate and store a secure cron secret
DO $$
DECLARE
  _secret text := gen_random_uuid()::text;
BEGIN
  INSERT INTO app_settings (key, value)
  VALUES ('outreach_cron_secret', jsonb_build_object('secret', _secret))
  ON CONFLICT (key) DO UPDATE SET value = jsonb_build_object('secret', _secret), updated_at = now();
END $$;

-- Drop old broken cron jobs (they used anon key for auth)
SELECT cron.unschedule('outreach-send-every-15min');
SELECT cron.unschedule('outreach-send-hourly');
SELECT cron.unschedule('outreach-pipeline-daily');
SELECT cron.unschedule('outreach-daily-report');

-- Wrapper function for outreach-send (uses cron secret via X-Outreach-Cron header)
CREATE OR REPLACE FUNCTION public.trigger_outreach_send()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _secret text;
  _supabase_url text := 'https://swsthxftugjqznqjcfpk.supabase.co';
BEGIN
  SELECT value->>'secret' INTO _secret FROM app_settings WHERE key = 'outreach_cron_secret';
  IF _secret IS NULL THEN RAISE EXCEPTION 'outreach_cron_secret not configured'; END IF;
  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/outreach-send',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-Outreach-Cron', _secret),
    body := '{}'::jsonb
  );
END;
$$;

-- Wrapper function for outreach-pipeline (uses service role key from vault)
CREATE OR REPLACE FUNCTION public.trigger_outreach_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text := 'https://swsthxftugjqznqjcfpk.supabase.co';
  _service_key text;
BEGIN
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF _service_key IS NULL THEN RAISE EXCEPTION 'Service role key not found in vault'; END IF;
  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/outreach-pipeline',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _service_key),
    body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
  );
END;
$$;

-- Wrapper function for outreach-daily-report (uses service role key from vault)
CREATE OR REPLACE FUNCTION public.trigger_outreach_daily_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text := 'https://swsthxftugjqznqjcfpk.supabase.co';
  _service_key text;
BEGIN
  SELECT decrypted_secret INTO _service_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF _service_key IS NULL THEN RAISE EXCEPTION 'Service role key not found in vault'; END IF;
  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/outreach-daily-report',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _service_key),
    body := '{}'::jsonb
  );
END;
$$;

-- Create new secure cron jobs
SELECT cron.schedule('outreach-send-hourly', '0 8-18 * * 1-5', 'SELECT public.trigger_outreach_send()');
SELECT cron.schedule('outreach-pipeline-daily', '0 9 * * 1-5', 'SELECT public.trigger_outreach_pipeline()');
SELECT cron.schedule('outreach-daily-report', '0 17 * * 1-5', 'SELECT public.trigger_outreach_daily_report()');

-- Activate CH Kirchenpartner Q3 2026 campaign
UPDATE outreach_campaigns SET status = 'active' WHERE id = '49a295ea-8e6c-46b3-97f5-1dc4631c9dd9';

-- Create pipeline schedule for Q3 campaign (daily lead discovery at 9am, weekdays)
INSERT INTO pipeline_schedules (campaign_id, is_active, cron_expression, search_query, country, max_results)
VALUES ('49a295ea-8e6c-46b3-97f5-1dc4631c9dd9', true, '0 9 * * 1-5', 'Schweizer Kirche Gemeinde Pfarrer Pastor Kontakt', 'ch', 15);