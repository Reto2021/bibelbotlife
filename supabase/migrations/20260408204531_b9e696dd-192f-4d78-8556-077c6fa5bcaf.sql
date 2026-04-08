
-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send onboarding email when church is activated
CREATE OR REPLACE FUNCTION public.notify_church_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _supabase_url text;
  _service_role_key text;
  _payload jsonb;
BEGIN
  -- Only fire when is_active changes from false to true
  IF (OLD.is_active = false AND NEW.is_active = true AND NEW.contact_email IS NOT NULL) THEN
    _supabase_url := current_setting('app.settings.supabase_url', true);
    _service_role_key := current_setting('app.settings.service_role_key', true);

    -- If settings not available, try vault
    IF _supabase_url IS NULL THEN
      SELECT decrypted_secret INTO _supabase_url
      FROM vault.decrypted_secrets
      WHERE name = 'supabase_url'
      LIMIT 1;
    END IF;

    IF _service_role_key IS NULL THEN
      SELECT decrypted_secret INTO _service_role_key
      FROM vault.decrypted_secrets
      WHERE name = 'supabase_service_role_key'
      LIMIT 1;
    END IF;

    -- Fallback: use the known project URL
    IF _supabase_url IS NULL THEN
      _supabase_url := 'https://swsthxftugjqznqjcfpk.supabase.co';
    END IF;

    _payload := jsonb_build_object(
      'templateName', 'church-onboarding',
      'recipientEmail', NEW.contact_email,
      'idempotencyKey', 'church-onboarding-' || NEW.id::text,
      'templateData', jsonb_build_object(
        'churchName', NEW.name,
        'slug', NEW.slug,
        'customBotName', COALESCE(NEW.custom_bot_name, 'BibelBot'),
        'contactName', NEW.pastor_name,
        'planTier', NEW.plan_tier::text
      )
    );

    -- Use pg_net to call the edge function asynchronously
    IF _service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-transactional-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _service_role_key
        ),
        body := _payload
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_church_activation_onboarding ON public.church_partners;
CREATE TRIGGER trg_church_activation_onboarding
  AFTER UPDATE ON public.church_partners
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION public.notify_church_activation();
