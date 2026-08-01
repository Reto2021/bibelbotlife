ALTER TABLE public.cross_posts
  ADD COLUMN IF NOT EXISTS quote text,
  ADD COLUMN IF NOT EXISTS quote_reference text,
  ADD COLUMN IF NOT EXISTS quote_burned boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.validate_cross_post()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF length(trim(COALESCE(NEW.place_label, ''))) < 1 OR length(NEW.place_label) > 120 THEN
    RAISE EXCEPTION 'place_label must be 1-120 characters';
  END IF;
  IF NEW.story IS NOT NULL AND length(NEW.story) > 500 THEN
    RAISE EXCEPTION 'story must be at most 500 characters';
  END IF;
  IF NEW.quote IS NOT NULL AND length(NEW.quote) > 280 THEN
    RAISE EXCEPTION 'quote must be at most 280 characters';
  END IF;
  IF NEW.quote_reference IS NOT NULL AND length(NEW.quote_reference) > 80 THEN
    RAISE EXCEPTION 'quote_reference must be at most 80 characters';
  END IF;
  IF NEW.author_name IS NOT NULL AND length(NEW.author_name) > 60 THEN
    RAISE EXCEPTION 'author_name too long';
  END IF;
  IF NEW.image_path IS NULL OR length(NEW.image_path) > 300 THEN
    RAISE EXCEPTION 'invalid image_path';
  END IF;
  IF NEW.country IS NOT NULL AND length(NEW.country) > 60 THEN
    RAISE EXCEPTION 'country too long';
  END IF;
  IF NEW.session_id IS NOT NULL AND length(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'session_id too long';
  END IF;
  IF NEW.lat IS NOT NULL AND (NEW.lat < -90 OR NEW.lat > 90) THEN
    RAISE EXCEPTION 'lat out of range';
  END IF;
  IF NEW.lng IS NOT NULL AND (NEW.lng < -180 OR NEW.lng > 180) THEN
    RAISE EXCEPTION 'lng out of range';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := COALESCE(NEW.status, 'pending');
    NEW.prayer_count := 0;
    NEW.rejection_reason := NULL;
    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_approved_cross_posts();

CREATE OR REPLACE FUNCTION public.get_approved_cross_posts()
RETURNS TABLE(
  id uuid, image_path text, place_label text, country text,
  lat double precision, lng double precision, story text,
  quote text, quote_reference text, quote_burned boolean,
  author_name text, is_anonymous boolean, prayer_count integer,
  amen_count integer, share_count integer, created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT cp.id, cp.image_path, cp.place_label, cp.country, cp.lat, cp.lng, cp.story,
         cp.quote, cp.quote_reference, cp.quote_burned,
         CASE WHEN cp.is_anonymous THEN NULL ELSE cp.author_name END,
         cp.is_anonymous, cp.prayer_count, cp.amen_count, cp.share_count, cp.created_at
  FROM public.cross_posts cp
  WHERE cp.status = 'approved'
  ORDER BY cp.created_at DESC
  LIMIT 500;
$function$;