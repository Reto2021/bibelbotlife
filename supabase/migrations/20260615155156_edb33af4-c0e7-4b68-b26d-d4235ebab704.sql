
-- 1. Spalten erweitern
ALTER TABLE public.bible_explanations
  ADD COLUMN IF NOT EXISTS explanation_rewritten TEXT,
  ADD COLUMN IF NOT EXISTS rewritten_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rewrite_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rewrite_error TEXT;

CREATE INDEX IF NOT EXISTS idx_bible_explanations_status ON public.bible_explanations(rewrite_status);
CREATE INDEX IF NOT EXISTS idx_bible_explanations_keyword ON public.bible_explanations(lower(keyword));

-- 2. RLS härten: anon/authenticated dürfen das Original NICHT mehr direkt lesen
DROP POLICY IF EXISTS "Anyone can read explanations" ON public.bible_explanations;

-- 3. Sichere View, die nur die umformulierte Version exposed
CREATE OR REPLACE VIEW public.bible_explanations_public
WITH (security_invoker = true) AS
SELECT
  id,
  translation,
  language,
  book_number,
  book,
  chapter,
  verse,
  keyword,
  explanation_rewritten AS explanation,
  created_at
FROM public.bible_explanations
WHERE rewrite_status = 'done'
  AND explanation_rewritten IS NOT NULL;

GRANT SELECT ON public.bible_explanations_public TO anon, authenticated;

-- 4. RPC: Schlüsselwörter in einem Antworttext finden (für Chat-Tooltips)
CREATE OR REPLACE FUNCTION public.match_explanations_in_text(
  input_text TEXT,
  lang TEXT DEFAULT 'de',
  max_results INT DEFAULT 20
)
RETURNS TABLE(keyword TEXT, explanation TEXT, book TEXT, chapter SMALLINT, verse SMALLINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (lower(be.keyword))
    be.keyword,
    be.explanation_rewritten,
    be.book,
    be.chapter,
    be.verse
  FROM public.bible_explanations be
  WHERE be.language = lang
    AND be.rewrite_status = 'done'
    AND be.explanation_rewritten IS NOT NULL
    AND length(be.keyword) >= 4
    AND position(lower(be.keyword) IN lower(input_text)) > 0
  ORDER BY lower(be.keyword), be.book_number, be.chapter, be.verse
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_explanations_in_text(TEXT, TEXT, INT) TO anon, authenticated;

-- 5. RPC: Status-Übersicht für Admin
CREATE OR REPLACE FUNCTION public.get_explanation_rewrite_status()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rewrite_status, count(*)::bigint
  FROM public.bible_explanations
  GROUP BY rewrite_status;
$$;

GRANT EXECUTE ON FUNCTION public.get_explanation_rewrite_status() TO authenticated;
