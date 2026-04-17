-- SEO content tables for Bible verse landing pages and topic hubs

CREATE TABLE public.seo_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'de',
  title TEXT NOT NULL,
  meta_description TEXT,
  intro TEXT,
  body_md TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  related_verses TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_topics_lang_slug ON public.seo_topics(language, slug);
CREATE INDEX idx_seo_topics_published ON public.seo_topics(is_published) WHERE is_published = true;

ALTER TABLE public.seo_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are publicly readable when published"
  ON public.seo_topics FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage topics"
  ON public.seo_topics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_seo_topics_updated_at
  BEFORE UPDATE ON public.seo_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cached SEO content for individual Bible verses
CREATE TABLE public.verse_seo_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_slug TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'de',
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  title TEXT,
  meta_description TEXT,
  context TEXT,
  reflection TEXT,
  related_references TEXT[] DEFAULT ARRAY[]::TEXT[],
  related_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (reference_slug, language)
);

CREATE INDEX idx_verse_seo_lang_slug ON public.verse_seo_content(language, reference_slug);
CREATE INDEX idx_verse_seo_featured ON public.verse_seo_content(is_featured) WHERE is_featured = true;
CREATE INDEX idx_verse_seo_book_chapter ON public.verse_seo_content(book, chapter, verse);

ALTER TABLE public.verse_seo_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verse SEO content is publicly readable"
  ON public.verse_seo_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage verse SEO content"
  ON public.verse_seo_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_verse_seo_updated_at
  BEFORE UPDATE ON public.verse_seo_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();