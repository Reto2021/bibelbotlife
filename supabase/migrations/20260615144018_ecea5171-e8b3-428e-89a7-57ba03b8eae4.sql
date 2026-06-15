
CREATE TABLE IF NOT EXISTS public.bible_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation text NOT NULL DEFAULT 'basisbibel',
  language text NOT NULL DEFAULT 'de',
  book_number smallint NOT NULL,
  book text NOT NULL,
  chapter smallint NOT NULL,
  verse smallint NOT NULL,
  keyword text NOT NULL,
  explanation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bible_explanations_ref ON public.bible_explanations(translation, book_number, chapter, verse);
GRANT SELECT ON public.bible_explanations TO anon, authenticated;
GRANT ALL ON public.bible_explanations TO service_role;
ALTER TABLE public.bible_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read explanations" ON public.bible_explanations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can manage explanations" ON public.bible_explanations TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.bible_chapter_headings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation text NOT NULL DEFAULT 'basisbibel',
  language text NOT NULL DEFAULT 'de',
  book_number smallint NOT NULL,
  book text NOT NULL,
  chapter smallint NOT NULL,
  position smallint NOT NULL,
  heading text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(translation, book_number, chapter, position)
);
CREATE INDEX IF NOT EXISTS idx_bible_headings_ref ON public.bible_chapter_headings(translation, book_number, chapter);
GRANT SELECT ON public.bible_chapter_headings TO anon, authenticated;
GRANT ALL ON public.bible_chapter_headings TO service_role;
ALTER TABLE public.bible_chapter_headings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read headings" ON public.bible_chapter_headings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can manage headings" ON public.bible_chapter_headings TO service_role USING (true) WITH CHECK (true);
