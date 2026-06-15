-- 1) Make sure all 4 restricted DE translations are registered in the meta table
INSERT INTO public.bible_translation_meta (code, name, year, language, publisher, source_url, rights_status, citation, is_restricted, testaments)
VALUES
  ('basisbibel', 'BasisBibel', 2021, 'de', 'Deutsche Bibelgesellschaft', 'https://www.die-bibel.de/bibeln/online-bibeln/basisbibel/',
   'protected',
   'Bibeltext aus der BasisBibel. Vollbibel. © 2021 Deutsche Bibelgesellschaft, Stuttgart. Verwendung mit freundlicher Genehmigung.',
   true, ARRAY['NT','OT']),
  ('schlachter2000', 'Schlachter 2000', 2000, 'de', 'Genfer Bibelgesellschaft', 'https://www.sermon-online.com/',
   'protected',
   'Bibeltext aus der Schlachter 2000. © 2000 Genfer Bibelgesellschaft, Romanel-sur-Lausanne. Verwendung mit freundlicher Genehmigung.',
   true, ARRAY['NT','OT']),
  ('EU', 'Einheitsübersetzung 2016', 2016, 'de', 'Katholisches Bibelwerk', 'https://www.bibelwerk.de/',
   'protected',
   'Bibeltext aus der Einheitsübersetzung der Heiligen Schrift. © 2016 Katholische Bibelanstalt, Stuttgart. Verwendung mit freundlicher Genehmigung.',
   true, ARRAY['NT','OT']),
  ('ELB', 'Elberfelder Bibel 2006', 2006, 'de', 'SCM R. Brockhaus', 'https://www.scm-rbrockhaus.de/',
   'protected',
   'Bibeltext aus der Elberfelder Bibel 2006. © 2006 SCM R. Brockhaus, Witten. Verwendung mit freundlicher Genehmigung.',
   true, ARRAY['NT','OT'])
ON CONFLICT (code) DO UPDATE SET
  is_restricted = true,
  rights_status = 'protected',
  citation = EXCLUDED.citation,
  publisher = COALESCE(EXCLUDED.publisher, bible_translation_meta.publisher),
  updated_at = now();

-- 2) Copy data from bible_verses to bible_verses_restricted
INSERT INTO public.bible_verses_restricted (translation, language, book, book_number, chapter, verse, text, source_url)
SELECT
  bv.translation, bv.language, bv.book, bv.book_number, bv.chapter, bv.verse, bv.text,
  btm.source_url
FROM public.bible_verses bv
LEFT JOIN public.bible_translation_meta btm ON btm.code = bv.translation
WHERE bv.translation IN ('basisbibel', 'schlachter2000', 'EU', 'ELB')
ON CONFLICT (translation, book_number, chapter, verse) DO NOTHING;

-- 3) Delete from public table
DELETE FROM public.bible_verses
WHERE translation IN ('basisbibel', 'schlachter2000', 'EU', 'ELB');
