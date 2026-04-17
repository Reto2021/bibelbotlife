CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'daily-social-post',
  '15 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://swsthxftugjqznqjcfpk.supabase.co/functions/v1/social-daily-post',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3c3RoeGZ0dWdqcXpucWpjZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDk2OTEsImV4cCI6MjA5MTEyNTY5MX0.PA5KmApM_W0sngwt5LmGssh8vcZVU7N0-XA8Dhd3lVU"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);