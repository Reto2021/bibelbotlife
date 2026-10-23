ALTER TABLE public.verse_seo_content
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS key_words jsonb,
  ADD COLUMN IF NOT EXISTS life_questions text[],
  ADD COLUMN IF NOT EXISTS prayer text;