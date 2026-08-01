ALTER TABLE public.cross_posts ADD COLUMN IF NOT EXISTS reported_count integer NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS public.record_cross_interaction(uuid, text, text);

CREATE OR REPLACE FUNCTION public.record_cross_interaction(
  p_post_id uuid,
  p_session_id text,
  p_kind text
)
RETURNS TABLE(prayer_count integer, amen_count integer, share_count integer, reported_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recent integer;
BEGIN
  IF p_kind NOT IN ('prayer','amen','share','report') THEN
    RAISE EXCEPTION 'invalid kind';
  END IF;
  IF p_session_id IS NULL OR length(p_session_id) < 8 OR length(p_session_id) > 100 THEN
    RAISE EXCEPTION 'invalid session';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.cross_posts WHERE id = p_post_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'post not available';
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.cross_interactions
  WHERE session_id = p_session_id AND created_at > now() - interval '1 hour';
  IF v_recent >= 120 THEN
    RAISE EXCEPTION 'too many interactions';
  END IF;

  INSERT INTO public.cross_interactions (post_id, session_id, kind)
  VALUES (p_post_id, p_session_id, p_kind)
  ON CONFLICT (post_id, session_id, kind) DO NOTHING;

  UPDATE public.cross_posts cp
  SET prayer_count = c.prayers,
      amen_count = c.amens,
      share_count = c.shares,
      reported_count = c.reports
  FROM (
    SELECT
      count(*) FILTER (WHERE kind = 'prayer')::integer AS prayers,
      count(*) FILTER (WHERE kind = 'amen')::integer AS amens,
      count(*) FILTER (WHERE kind = 'share')::integer AS shares,
      count(*) FILTER (WHERE kind = 'report')::integer AS reports
    FROM public.cross_interactions WHERE post_id = p_post_id
  ) c
  WHERE cp.id = p_post_id;

  RETURN QUERY
  SELECT cp.prayer_count, cp.amen_count, cp.share_count, cp.reported_count
  FROM public.cross_posts cp WHERE cp.id = p_post_id;
END;
$function$;