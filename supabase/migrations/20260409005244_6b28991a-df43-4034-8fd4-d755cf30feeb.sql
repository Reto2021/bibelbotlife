
-- Bible verses table for semantic search
CREATE TABLE public.bible_verses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book text NOT NULL,
  book_number smallint NOT NULL,
  chapter smallint NOT NULL,
  verse smallint NOT NULL,
  text text NOT NULL,
  translation text NOT NULL,
  fts tsvector GENERATED ALWAYS AS (to_tsvector('german', text)) STORED,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX idx_bible_fts ON public.bible_verses USING GIN(fts);
CREATE INDEX idx_bible_ref ON public.bible_verses (translation, book_number, chapter, verse);
CREATE UNIQUE INDEX idx_bible_unique ON public.bible_verses (translation, book_number, chapter, verse);

-- RLS
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bible verses"
ON public.bible_verses FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage verses"
ON public.bible_verses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
