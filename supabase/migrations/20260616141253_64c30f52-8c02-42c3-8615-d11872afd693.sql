ALTER TYPE outreach_email_status ADD VALUE IF NOT EXISTS 'failed_system';
ALTER TABLE public.outreach_emails ADD COLUMN IF NOT EXISTS error_message text;