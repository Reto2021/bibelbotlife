-- Add FTS column to restricted bible verses (generated tsvector based on language)
ALTER TABLE public.bible_verses_restricted
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      CASE language
        WHEN 'de' THEN 'german'::regconfig
        WHEN 'en' THEN 'english'::regconfig
        WHEN 'fr' THEN 'french'::regconfig
        WHEN 'es' THEN 'spanish'::regconfig
        WHEN 'it' THEN 'italian'::regconfig
        ELSE 'simple'::regconfig
      END,
      coalesce(text, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_bvr_fts ON public.bible_verses_restricted USING GIN (fts);

-- Secure FTS search function for restricted translations.
-- Returns at most 50 verses per call, never bulk-dumps a whole work.
CREATE OR REPLACE FUNCTION public.search_bible_verses_restricted(
  search_query text,
  translation_filter text DEFAULT NULL,
  book_boost text[] DEFAULT NULL,
  result_limit integer DEFAULT 20,
  language_filter text DEFAULT 'de'
)
RETURNS TABLE(
  id uuid, book text, book_number smallint, chapter smallint,
  verse smallint, text text, translation text, source_url text, rank real
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fts_config regconfig;
  effective_limit int;
BEGIN
  fts_config := CASE language_filter
    WHEN 'de' THEN 'german'::regconfig
    WHEN 'en' THEN 'english'::regconfig
    WHEN 'fr' THEN 'french'::regconfig
    WHEN 'es' THEN 'spanish'::regconfig
    WHEN 'it' THEN 'italian'::regconfig
    ELSE 'simple'::regconfig
  END;

  -- Hard cap: never more than 50 verses per call (anti-scraping)
  effective_limit := LEAST(GREATEST(result_limit, 1), 50);

  RETURN QUERY
  SELECT
    bvr.id, bvr.book, bvr.book_number, bvr.chapter, bvr.verse, bvr.text,
    bvr.translation, bvr.source_url,
    CASE
      WHEN book_boost IS NOT NULL AND bvr.book = ANY(book_boost)
        THEN ts_rank(bvr.fts, to_tsquery(fts_config, search_query)) * 2
      ELSE ts_rank(bvr.fts, to_tsquery(fts_config, search_query))
    END::real AS rank
  FROM public.bible_verses_restricted bvr
  WHERE bvr.fts @@ to_tsquery(fts_config, search_query)
    AND bvr.language = language_filter
    AND (translation_filter IS NULL OR bvr.translation = translation_filter)
  ORDER BY rank DESC
  LIMIT effective_limit;
END;
$$;

-- Allow anon/authenticated to call the function (function still hard-limits to 50 rows)
GRANT EXECUTE ON FUNCTION public.search_bible_verses_restricted(text, text, text[], integer, text) TO anon, authenticated, service_role;
