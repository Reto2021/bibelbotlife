-- Add slug column to cross_posts
ALTER TABLE public.cross_posts ADD COLUMN IF NOT EXISTS slug text;

-- Helper: create a URL-safe slug from place label + post id
CREATE OR REPLACE FUNCTION public.generate_cross_slug(place_label text, post_id uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  raw text;
  slug text;
  short_id text;
BEGIN
  raw := lower(coalesce(place_label, ''));
  -- German umlauts / sharp s
  raw := replace(raw, 'ä', 'ae');
  raw := replace(raw, 'ö', 'oe');
  raw := replace(raw, 'ü', 'ue');
  raw := replace(raw, 'ß', 'ss');
  raw := replace(raw, 'à', 'a');
  raw := replace(raw, 'á', 'a');
  raw := replace(raw, 'â', 'a');
  raw := replace(raw, 'ã', 'a');
  raw := replace(raw, 'å', 'a');
  raw := replace(raw, 'æ', 'ae');
  raw := replace(raw, 'ç', 'c');
  raw := replace(raw, 'è', 'e');
  raw := replace(raw, 'é', 'e');
  raw := replace(raw, 'ê', 'e');
  raw := replace(raw, 'ë', 'e');
  raw := replace(raw, 'ì', 'i');
  raw := replace(raw, 'í', 'i');
  raw := replace(raw, 'î', 'i');
  raw := replace(raw, 'ï', 'i');
  raw := replace(raw, 'ð', 'd');
  raw := replace(raw, 'ñ', 'n');
  raw := replace(raw, 'ò', 'o');
  raw := replace(raw, 'ó', 'o');
  raw := replace(raw, 'ô', 'o');
  raw := replace(raw, 'õ', 'o');
  raw := replace(raw, 'ø', 'o');
  raw := replace(raw, 'ù', 'u');
  raw := replace(raw, 'ú', 'u');
  raw := replace(raw, 'û', 'u');
  raw := replace(raw, 'ý', 'y');
  raw := replace(raw, 'ÿ', 'y');
  raw := replace(raw, 'č', 'c');
  raw := replace(raw, 'ć', 'c');
  raw := replace(raw, 'ř', 'r');
  raw := replace(raw, 'š', 's');
  raw := replace(raw, 'ž', 'z');
  raw := replace(raw, 'ł', 'l');
  raw := replace(raw, 'ń', 'n');
  raw := replace(raw, 'ś', 's');
  raw := replace(raw, 'ź', 'z');
  raw := replace(raw, 'ż', 'z');
  -- keep only letters, digits and spaces
  raw := regexp_replace(raw, '[^a-z0-9\s]+', ' ', 'g');
  -- collapse whitespace and trim
  raw := trim(regexp_replace(raw, '\s+', ' ', 'g'));
  -- replace spaces with hyphens
  slug := regexp_replace(raw, '\s+', '-', 'g');
  -- truncate to 40 chars to stay readable
  slug := left(slug, 40);
  -- remove trailing hyphen if any
  slug := rtrim(slug, '-');
  -- append short id from uuid (first 4 chars)
  short_id := left(post_id::text, 4);
  RETURN slug || '-' || short_id;
END;
$$;

-- Backfill slugs for existing approved posts (skip if slug already set)
UPDATE public.cross_posts
SET slug = public.generate_cross_slug(place_label, id)
WHERE slug IS NULL;

-- Ensure uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS cross_posts_slug_unique_idx ON public.cross_posts (slug);

-- Drop and recreate the public read function so the return type can include slug
DROP FUNCTION IF EXISTS public.get_approved_cross_posts();

CREATE OR REPLACE FUNCTION public.get_approved_cross_posts()
RETURNS TABLE(
  id uuid,
  image_path text,
  place_label text,
  country text,
  lat double precision,
  lng double precision,
  story text,
  quote text,
  quote_reference text,
  quote_burned boolean,
  author_name text,
  is_anonymous boolean,
  prayer_count integer,
  amen_count integer,
  share_count integer,
  reported_count integer,
  created_at timestamp with time zone,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cp.id,
    cp.image_path,
    cp.place_label,
    cp.country,
    cp.lat,
    cp.lng,
    cp.story,
    cp.quote,
    cp.quote_reference,
    cp.quote_burned,
    cp.author_name,
    cp.is_anonymous,
    cp.prayer_count,
    cp.amen_count,
    cp.share_count,
    cp.reported_count,
    cp.created_at,
    cp.slug
  FROM public.cross_posts cp
  WHERE cp.status = 'approved'
  ORDER BY cp.created_at DESC;
$$;