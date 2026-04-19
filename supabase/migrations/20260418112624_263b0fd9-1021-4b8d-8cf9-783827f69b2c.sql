-- Deduplicate any existing rows first (keep newest)
DELETE FROM public.seo_topics a
USING public.seo_topics b
WHERE a.ctid < b.ctid AND a.slug = b.slug AND a.language = b.language;

-- Add unique constraint required for upsert onConflict
ALTER TABLE public.seo_topics
ADD CONSTRAINT seo_topics_slug_language_key UNIQUE (slug, language);