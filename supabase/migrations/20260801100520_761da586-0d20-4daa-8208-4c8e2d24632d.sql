CREATE TABLE public.cross_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_path text NOT NULL,
  place_label text NOT NULL,
  country text,
  lat double precision,
  lng double precision,
  story text,
  author_name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  session_id text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  prayer_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz,
  moderated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cross_posts TO authenticated;
GRANT INSERT ON public.cross_posts TO anon;
GRANT ALL ON public.cross_posts TO service_role;

ALTER TABLE public.cross_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a cross post"
ON public.cross_posts FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending' AND prayer_count = 0);

CREATE POLICY "Admins can view all cross posts"
ON public.cross_posts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cross posts"
ON public.cross_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cross posts"
ON public.cross_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX cross_posts_status_created_idx ON public.cross_posts (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.validate_cross_post()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
    NEW.status := 'pending';
    NEW.prayer_count := 0;
    NEW.rejection_reason := NULL;
    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_cross_post_trg
BEFORE INSERT OR UPDATE ON public.cross_posts
FOR EACH ROW EXECUTE FUNCTION public.validate_cross_post();

CREATE OR REPLACE FUNCTION public.get_approved_cross_posts()
RETURNS TABLE(
  id uuid, image_path text, place_label text, country text,
  lat double precision, lng double precision, story text,
  author_name text, is_anonymous boolean, prayer_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id, cp.image_path, cp.place_label, cp.country, cp.lat, cp.lng, cp.story,
         CASE WHEN cp.is_anonymous THEN NULL ELSE cp.author_name END,
         cp.is_anonymous, cp.prayer_count, cp.created_at
  FROM public.cross_posts cp
  WHERE cp.status = 'approved'
  ORDER BY cp.created_at DESC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.increment_cross_prayer_count(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.cross_posts
  SET prayer_count = prayer_count + 1
  WHERE id = post_id AND status = 'approved';
$$;

CREATE POLICY "Anyone can upload cross photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'cross-photos');

CREATE POLICY "Admins can read cross photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cross-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cross photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cross-photos' AND public.has_role(auth.uid(), 'admin'::app_role));