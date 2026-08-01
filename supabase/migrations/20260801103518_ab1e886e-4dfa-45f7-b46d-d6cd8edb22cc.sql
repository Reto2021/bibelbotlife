CREATE OR REPLACE FUNCTION public.validate_cross_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF length(trim(COALESCE(NEW.place_label, ''))) < 1 OR length(NEW.place_label) > 120 THEN
    RAISE EXCEPTION 'place_label must be 1-120 characters';
  END IF;
  IF NEW.story IS NOT NULL AND length(NEW.story) > 500 THEN
    RAISE EXCEPTION 'story must be at most 500 characters';
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