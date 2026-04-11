-- Add church context and traffic source tracking to analytics_events
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS church_slug text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text;

-- Index for fast per-church queries
CREATE INDEX IF NOT EXISTS idx_analytics_church_slug ON public.analytics_events (church_slug) WHERE church_slug IS NOT NULL;

-- Index for time-based aggregation per church
CREATE INDEX IF NOT EXISTS idx_analytics_church_time ON public.analytics_events (church_slug, created_at DESC) WHERE church_slug IS NOT NULL;

-- Index for utm_source filtering
CREATE INDEX IF NOT EXISTS idx_analytics_utm_source ON public.analytics_events (utm_source) WHERE utm_source IS NOT NULL;

-- Update the validation trigger to accept the new fields
CREATE OR REPLACE FUNCTION public.validate_analytics_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Enforce allowed event types
  IF NEW.event_type NOT IN ('pageview', 'event') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  -- Limit field sizes
  IF length(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'session_id too long';
  END IF;
  IF NEW.event_name IS NOT NULL AND length(NEW.event_name) > 200 THEN
    RAISE EXCEPTION 'event_name too long';
  END IF;
  IF NEW.event_data IS NOT NULL AND octet_length(NEW.event_data::text) > 4096 THEN
    RAISE EXCEPTION 'event_data too large';
  END IF;
  IF NEW.user_agent IS NOT NULL AND length(NEW.user_agent) > 500 THEN
    NEW.user_agent := left(NEW.user_agent, 500);
  END IF;
  IF NEW.referrer IS NOT NULL AND length(NEW.referrer) > 2000 THEN
    NEW.referrer := left(NEW.referrer, 2000);
  END IF;
  -- Validate new fields
  IF NEW.church_slug IS NOT NULL AND length(NEW.church_slug) > 100 THEN
    RAISE EXCEPTION 'church_slug too long';
  END IF;
  IF NEW.utm_source IS NOT NULL AND length(NEW.utm_source) > 100 THEN
    NEW.utm_source := left(NEW.utm_source, 100);
  END IF;
  IF NEW.utm_medium IS NOT NULL AND length(NEW.utm_medium) > 100 THEN
    NEW.utm_medium := left(NEW.utm_medium, 100);
  END IF;
  RETURN NEW;
END;
$function$;