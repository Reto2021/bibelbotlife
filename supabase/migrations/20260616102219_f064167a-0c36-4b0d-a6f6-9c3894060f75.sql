
-- Remove overly permissive UPDATE policy (USING true / WITH CHECK true)
DROP POLICY IF EXISTS "Service can update subscribers" ON public.daily_subscribers;

-- service_role bypasses RLS anyway; no replacement policy needed for normal users.
-- Admins keep SELECT, anon/auth can INSERT (validated by trigger below), nobody else can UPDATE/DELETE.

-- Validation trigger on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.validate_daily_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Phone: optional, but if set must look like E.164 (max 20 chars)
  IF NEW.phone_number IS NOT NULL THEN
    IF length(NEW.phone_number) > 20 OR NEW.phone_number !~ '^\+?[0-9 ()-]{5,20}$' THEN
      RAISE EXCEPTION 'Invalid phone_number format';
    END IF;
  END IF;

  -- Telegram chat id: optional, numeric string, max 32 chars
  IF NEW.telegram_chat_id IS NOT NULL THEN
    IF length(NEW.telegram_chat_id) > 32 OR NEW.telegram_chat_id !~ '^-?[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid telegram_chat_id';
    END IF;
  END IF;

  -- Push subscription: optional, must be jsonb object with valid https endpoint and keys, total size capped
  IF NEW.push_subscription IS NOT NULL THEN
    IF jsonb_typeof(NEW.push_subscription) <> 'object' THEN
      RAISE EXCEPTION 'push_subscription must be a JSON object';
    END IF;
    IF length(NEW.push_subscription::text) > 4096 THEN
      RAISE EXCEPTION 'push_subscription too large';
    END IF;
    IF NOT (NEW.push_subscription ? 'endpoint') OR NOT (NEW.push_subscription ? 'keys') THEN
      RAISE EXCEPTION 'push_subscription missing endpoint or keys';
    END IF;
    IF (NEW.push_subscription->>'endpoint') !~ '^https://' THEN
      RAISE EXCEPTION 'push_subscription endpoint must be https';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_subscribers_validate ON public.daily_subscribers;
CREATE TRIGGER daily_subscribers_validate
BEFORE INSERT OR UPDATE ON public.daily_subscribers
FOR EACH ROW EXECUTE FUNCTION public.validate_daily_subscriber();
