ALTER TABLE public.cross_posts
  ADD COLUMN IF NOT EXISTS amen_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;

CREATE TABLE public.cross_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.cross_posts(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  kind text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cross_interactions_kind_check CHECK (kind IN ('prayer','amen','share')),
  CONSTRAINT cross_interactions_unique UNIQUE (post_id, session_id, kind)
);

GRANT ALL ON public.cross_interactions TO service_role;

ALTER TABLE public.cross_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cross interactions"
  ON public.cross_interactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX cross_interactions_session_time_idx
  ON public.cross_interactions (session_id, created_at DESC);

-- Close the unbounded legacy increment path
REVOKE ALL ON FUNCTION public.increment_cross_prayer_count(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_cross_interaction(
  p_post_id uuid,
  p_session_id text,
  p_kind text
)
RETURNS TABLE(prayer_count integer, amen_count integer, share_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent integer;
BEGIN
  IF p_kind NOT IN ('prayer','amen','share') THEN
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
      share_count = c.shares
  FROM (
    SELECT
      count(*) FILTER (WHERE kind = 'prayer')::integer AS prayers,
      count(*) FILTER (WHERE kind = 'amen')::integer AS amens,
      count(*) FILTER (WHERE kind = 'share')::integer AS shares
    FROM public.cross_interactions WHERE post_id = p_post_id
  ) c
  WHERE cp.id = p_post_id;

  RETURN QUERY
  SELECT cp.prayer_count, cp.amen_count, cp.share_count
  FROM public.cross_posts cp WHERE cp.id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_cross_interaction(uuid, text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_approved_cross_posts();

CREATE FUNCTION public.get_approved_cross_posts()
RETURNS TABLE(
  id uuid, image_path text, place_label text, country text,
  lat double precision, lng double precision, story text,
  author_name text, is_anonymous boolean,
  prayer_count integer, amen_count integer, share_count integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id, cp.image_path, cp.place_label, cp.country, cp.lat, cp.lng, cp.story,
         CASE WHEN cp.is_anonymous THEN NULL ELSE cp.author_name END,
         cp.is_anonymous, cp.prayer_count, cp.amen_count, cp.share_count, cp.created_at
  FROM public.cross_posts cp
  WHERE cp.status = 'approved'
  ORDER BY cp.created_at DESC
  LIMIT 500;
$$;