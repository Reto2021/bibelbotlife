-- Raise restricted snippet limit from 7 to 30 (covers a full chapter for BibleSearch display)
CREATE OR REPLACE FUNCTION public.get_restricted_verse_snippet(
  p_translation text,
  p_book_number smallint,
  p_chapter smallint,
  p_verse_start smallint,
  p_verse_end smallint DEFAULT NULL::smallint
)
RETURNS TABLE(verse smallint, text text, book text, source_url text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_end smallint;
  v_range int;
BEGIN
  IF p_translation IS NULL OR length(p_translation) = 0 THEN
    RAISE EXCEPTION 'translation required';
  END IF;
  IF p_book_number IS NULL OR p_book_number < 1 OR p_book_number > 100 THEN
    RAISE EXCEPTION 'invalid book_number';
  END IF;
  IF p_chapter IS NULL OR p_chapter < 1 OR p_chapter > 200 THEN
    RAISE EXCEPTION 'invalid chapter';
  END IF;
  IF p_verse_start IS NULL OR p_verse_start < 1 OR p_verse_start > 200 THEN
    RAISE EXCEPTION 'invalid verse_start';
  END IF;

  v_end := COALESCE(p_verse_end, p_verse_start);
  IF v_end < p_verse_start THEN
    RAISE EXCEPTION 'verse_end must be >= verse_start';
  END IF;

  v_range := v_end - p_verse_start + 1;
  IF v_range > 30 THEN
    RAISE EXCEPTION 'snippet limit exceeded: max 30 verses per call (requested %)', v_range;
  END IF;

  RETURN QUERY
    SELECT bvr.verse, bvr.text, bvr.book, bvr.source_url
    FROM public.bible_verses_restricted bvr
    WHERE bvr.translation  = p_translation
      AND bvr.book_number  = p_book_number
      AND bvr.chapter      = p_chapter
      AND bvr.verse       >= p_verse_start
      AND bvr.verse       <= v_end
    ORDER BY bvr.verse;
END;
$function$;

-- Register NIV translation metadata
INSERT INTO public.bible_translation_meta (
  code, name, year, language, confession, publisher, source_url,
  rights_status, citation, description, is_restricted, testaments
) VALUES (
  'NIV',
  'New International Version',
  2011,
  'en',
  'Ecumenical (Evangelical)',
  'Biblica, Inc.',
  'https://www.biblica.com/bible/niv/',
  'protected',
  'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.',
  'Modern English translation, widely used in evangelical and ecumenical contexts.',
  true,
  ARRAY['NT', 'OT']
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  citation = EXCLUDED.citation,
  source_url = EXCLUDED.source_url,
  publisher = EXCLUDED.publisher,
  language = EXCLUDED.language,
  is_restricted = true,
  updated_at = now();
