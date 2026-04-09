
CREATE OR REPLACE FUNCTION public.search_bible_verses(
  search_query text,
  translation_filter text DEFAULT NULL,
  book_boost text[] DEFAULT NULL,
  result_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  book text,
  book_number smallint,
  chapter smallint,
  verse smallint,
  text text,
  translation text,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bv.id, bv.book, bv.book_number, bv.chapter, bv.verse, bv.text, bv.translation,
    CASE
      WHEN book_boost IS NOT NULL AND bv.book = ANY(book_boost)
      THEN ts_rank(bv.fts, to_tsquery('german', search_query)) * 2
      ELSE ts_rank(bv.fts, to_tsquery('german', search_query))
    END::real as rank
  FROM bible_verses bv
  WHERE bv.fts @@ to_tsquery('german', search_query)
    AND (translation_filter IS NULL OR bv.translation = translation_filter)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;
