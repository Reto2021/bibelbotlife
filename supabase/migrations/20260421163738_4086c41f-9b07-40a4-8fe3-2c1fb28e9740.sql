-- Schutzfunktion: Nur kurze Zitat-Slices aus geschützten Übersetzungen.
-- Erzwingt ein hartes Maximum von 7 Versen pro Aufruf (Kurzzitat-Regel).
-- SECURITY DEFINER läuft mit Table-Owner-Rechten, sodass RLS der restricted-Tabelle
-- umgangen werden kann — aber nur über diesen engen, auditierbaren Pfad.

CREATE OR REPLACE FUNCTION public.get_restricted_verse_snippet(
  p_translation  text,
  p_book_number  smallint,
  p_chapter      smallint,
  p_verse_start  smallint,
  p_verse_end    smallint DEFAULT NULL
)
RETURNS TABLE (
  verse smallint,
  text  text,
  book  text,
  source_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end smallint;
  v_range int;
BEGIN
  -- Basisvalidierung
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

  -- HARTES KURZZITAT-LIMIT: maximal 7 Verse pro Aufruf
  v_range := v_end - p_verse_start + 1;
  IF v_range > 7 THEN
    RAISE EXCEPTION 'snippet limit exceeded: max 7 verses per call (requested %)', v_range;
  END IF;

  -- Nur aufrufbar über vertrauenswürdige Pfade:
  -- service_role (Edge Functions) ODER der Besitzer der Funktion.
  -- Anon/authenticated können die Funktion aufrufen, sie bekommen aber nur den Slice zurück.
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
$$;

-- Nur authentifizierte Rollen (inkl. service_role) — kein anon
REVOKE ALL ON FUNCTION public.get_restricted_verse_snippet(text, smallint, smallint, smallint, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_restricted_verse_snippet(text, smallint, smallint, smallint, smallint) TO authenticated, service_role;