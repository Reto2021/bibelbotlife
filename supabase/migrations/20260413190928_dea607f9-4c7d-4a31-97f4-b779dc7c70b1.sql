
-- Add language column to bible_verses (may already exist from partial migration)
ALTER TABLE public.bible_verses ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de';

-- B-tree index for language + translation
CREATE INDEX IF NOT EXISTS idx_bible_verses_language_translation ON public.bible_verses (language, translation);

-- B-tree index for language filtering (used with existing GIN fts index)
CREATE INDEX IF NOT EXISTS idx_bible_verses_language ON public.bible_verses (language);

-- Replace search function with language-aware version
CREATE OR REPLACE FUNCTION public.search_bible_verses(
  search_query text,
  translation_filter text DEFAULT NULL,
  book_boost text[] DEFAULT NULL,
  result_limit integer DEFAULT 20,
  language_filter text DEFAULT 'de'
)
RETURNS TABLE(id uuid, book text, book_number smallint, chapter smallint, verse smallint, text text, translation text, rank real)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fts_config regconfig;
BEGIN
  fts_config := CASE language_filter
    WHEN 'de' THEN 'german'::regconfig
    WHEN 'en' THEN 'english'::regconfig
    WHEN 'fr' THEN 'french'::regconfig
    WHEN 'es' THEN 'spanish'::regconfig
    WHEN 'it' THEN 'italian'::regconfig
    WHEN 'pt' THEN 'portuguese'::regconfig
    WHEN 'nl' THEN 'dutch'::regconfig
    WHEN 'da' THEN 'danish'::regconfig
    WHEN 'no' THEN 'norwegian'::regconfig
    WHEN 'sv' THEN 'swedish'::regconfig
    WHEN 'fi' THEN 'finnish'::regconfig
    WHEN 'ru' THEN 'russian'::regconfig
    WHEN 'el' THEN 'greek'::regconfig
    WHEN 'hu' THEN 'hungarian'::regconfig
    WHEN 'ro' THEN 'romanian'::regconfig
    WHEN 'ar' THEN 'arabic'::regconfig
    ELSE 'simple'::regconfig
  END;

  RETURN QUERY
  SELECT
    bv.id, bv.book, bv.book_number, bv.chapter, bv.verse, bv.text, bv.translation,
    CASE
      WHEN book_boost IS NOT NULL AND bv.book = ANY(book_boost)
      THEN ts_rank(bv.fts, to_tsquery(fts_config, search_query)) * 2
      ELSE ts_rank(bv.fts, to_tsquery(fts_config, search_query))
    END::real as rank
  FROM bible_verses bv
  WHERE bv.fts @@ to_tsquery(fts_config, search_query)
    AND bv.language = language_filter
    AND (translation_filter IS NULL OR bv.translation = translation_filter)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$function$;
