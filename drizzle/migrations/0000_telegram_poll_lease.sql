ALTER TABLE public.telegram_bot_state ADD COLUMN IF NOT EXISTS poll_lock_token uuid, ADD COLUMN IF NOT EXISTS poll_lock_until timestamptz;
CREATE OR REPLACE FUNCTION public.acquire_telegram_poll_lock(p_token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acquired boolean;
BEGIN
  UPDATE public.telegram_bot_state SET poll_lock_token = p_token, poll_lock_until = clock_timestamp() + interval '5 minutes' WHERE id = 1 AND (poll_lock_until IS NULL OR poll_lock_until <= clock_timestamp());
  acquired := FOUND;
  RETURN acquired;
END;
$$;
CREATE OR REPLACE FUNCTION public.renew_telegram_poll_lock(p_token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.telegram_bot_state SET poll_lock_until = clock_timestamp() + interval '5 minutes' WHERE id = 1 AND poll_lock_token = p_token AND poll_lock_until > clock_timestamp();
  RETURN FOUND;
END;
$$;
CREATE OR REPLACE FUNCTION public.release_telegram_poll_lock(p_token uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.telegram_bot_state SET poll_lock_token = NULL, poll_lock_until = NULL WHERE id = 1 AND poll_lock_token = p_token;
$$;
REVOKE ALL ON FUNCTION public.acquire_telegram_poll_lock(uuid), public.renew_telegram_poll_lock(uuid), public.release_telegram_poll_lock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_telegram_poll_lock(uuid), public.renew_telegram_poll_lock(uuid), public.release_telegram_poll_lock(uuid) TO service_role;