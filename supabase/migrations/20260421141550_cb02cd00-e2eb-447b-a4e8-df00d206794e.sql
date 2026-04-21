-- Metadaten zu jeder Übersetzung (Name, Jahr, Konfession, Rechte-Status, Charakteristik)
CREATE TABLE public.bible_translation_meta (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER,
  language TEXT NOT NULL DEFAULT 'de',
  confession TEXT,
  publisher TEXT,
  translators TEXT,
  source_url TEXT,
  rights_status TEXT NOT NULL DEFAULT 'protected', -- 'public_domain' | 'protected'
  citation TEXT NOT NULL,                          -- vollständige wissenschaftliche Zitation
  description TEXT,                                -- kurze Charakteristik für Chat-Kontext
  is_restricted BOOLEAN NOT NULL DEFAULT true,     -- true => bible_verses_restricted, false => bible_verses
  testaments TEXT[] NOT NULL DEFAULT ARRAY['NT','AT'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_translation_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translation meta"
  ON public.bible_translation_meta FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role manages translation meta"
  ON public.bible_translation_meta FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_bible_translation_meta_updated_at
BEFORE UPDATE ON public.bible_translation_meta
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Geschützte Übersetzungen: NIEMALS öffentlich lesbar.
-- Nur Edge Functions (service_role) dürfen lesen/schreiben.
-- Inhalt wird ausschliesslich als Chat-Kontext an das Modell gegeben, nie an Frontend ausgeliefert.
CREATE TABLE public.bible_verses_restricted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation TEXT NOT NULL REFERENCES public.bible_translation_meta(code),
  language TEXT NOT NULL DEFAULT 'de',
  book TEXT NOT NULL,
  book_number SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse SMALLINT NOT NULL,
  text TEXT NOT NULL,
  source_url TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (translation, book_number, chapter, verse)
);

CREATE INDEX idx_bvr_lookup ON public.bible_verses_restricted (translation, book_number, chapter, verse);
CREATE INDEX idx_bvr_book_chapter ON public.bible_verses_restricted (translation, book, chapter);

ALTER TABLE public.bible_verses_restricted ENABLE ROW LEVEL SECURITY;

-- Explizit KEINE öffentliche SELECT-Policy. Nur service_role.
CREATE POLICY "Service role only - restricted bible"
  ON public.bible_verses_restricted FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "No public access on restricted bible"
  ON public.bible_verses_restricted FOR SELECT
  TO anon, authenticated
  USING (false);

-- Cache, welche Kapitel bereits geladen wurden (vermeidet erneutes Scrapen)
CREATE TABLE public.bible_chapter_fetch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation TEXT NOT NULL,
  book_number SMALLINT NOT NULL,
  chapter SMALLINT NOT NULL,
  verse_count INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed' | 'partial'
  error_message TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (translation, book_number, chapter)
);

ALTER TABLE public.bible_chapter_fetch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read fetch log"
  ON public.bible_chapter_fetch_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages fetch log"
  ON public.bible_chapter_fetch_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_fetch_log_translation ON public.bible_chapter_fetch_log (translation, book_number, chapter);


-- Metadaten zu allen 23 Übersetzungen von bibel.github.io vorbefüllen
INSERT INTO public.bible_translation_meta (code, name, year, language, confession, publisher, translators, source_url, rights_status, citation, description, is_restricted, testaments) VALUES
-- Bereits in bible_verses (Bestand) – nur für Vollständigkeit der Metadaten
('LU1912',  'Lutherbibel 1912', 1912, 'de', 'evangelisch-lutherisch', 'Deutsche Bibelgesellschaft', 'Martin Luther (rev. 1912)', 'https://bibel.github.io', 'public_domain',
  'Lutherbibel, revidierter Text 1912, gemeinfrei.', 'Klassische deutsche Lutherübersetzung in der Revision von 1912. Gemeinfrei. Sprachlich altertümlich.', false, ARRAY['NT','AT']),
('SCH2000', 'Schlachter 2000', 2000, 'de', 'evangelisch-reformiert', 'Genfer Bibelgesellschaft', 'Franz Eugen Schlachter (rev. 2000)', 'https://bibel.github.io', 'protected',
  'Schlachter-Bibel, Version 2000, © Genfer Bibelgesellschaft.', 'Wortgetreue evangelikale Übersetzung in der Tradition von Franz Eugen Schlachter, Revision 2000.', false, ARRAY['NT','AT']),
('ELB',     'Elberfelder Bibel', 2006, 'de', 'evangelisch (Brüderbewegung)', 'SCM R. Brockhaus', 'John Nelson Darby u.a. (rev. 2006)', 'https://bibel.github.io', 'protected',
  'Elberfelder Bibel, revidierte Fassung 2006, © SCM R. Brockhaus, Witten.', 'Sehr wortgetreue Übersetzung, beliebt für exegetisches Studium.', false, ARRAY['NT','AT']),
('EU',      'Einheitsübersetzung', 2016, 'de', 'römisch-katholisch', 'Katholische Bibelanstalt', 'Ökumenische Arbeitsgemeinschaft', 'https://bibel.github.io', 'protected',
  'Einheitsübersetzung der Heiligen Schrift, revidierte Fassung 2016, © Katholische Bibelanstalt, Stuttgart.', 'Offizielle deutschsprachige katholische Übersetzung, liturgisch verwendet.', false, ARRAY['NT','AT']),
('ZB',      'Zürcher Bibel', 2007, 'de', 'evangelisch-reformiert', 'Theologischer Verlag Zürich', 'Reformierte Kirchen Deutschschweiz', 'https://bibel.github.io', 'protected',
  'Zürcher Bibel, Ausgabe 2007, © Theologischer Verlag Zürich.', 'Reformierte Übersetzung in der Tradition Zwinglis, philologisch präzise.', false, ARRAY['NT','AT']),
-- Werden via On-Demand befüllt – gemeinfrei (in bible_verses)
('HRD',     'Henne-Rösch-Bibel (Paderborner Bibel)', 1934, 'de', 'römisch-katholisch', 'Verlag Ferdinand Schöningh', 'Eugen Henne, Konstantin Rösch', 'https://bibel.github.io', 'public_domain',
  'Henne-Rösch-Bibel (Paderborner Bibel), übers. v. E. Henne u. K. Rösch, Schöningh, Paderborn 1934. Gemeinfrei.', 'Katholische Volksbibel der Vorkriegszeit, als gemeinfreie kath. Alternative bedeutsam.', false, ARRAY['NT','AT']),
('GRU',     'Grünewald-Bibel', 1924, 'de', 'römisch-katholisch', 'Verlag Matthias Grünewald', 'Konstantin Rösch (NT)', 'https://bibel.github.io', 'public_domain',
  'Grünewald-Bibel (Neues Testament), übers. v. K. Rösch, Verlag Matthias Grünewald, Mainz 1924. Gemeinfrei.', 'Katholische NT-Übersetzung der 1920er Jahre, gemeinfrei.', false, ARRAY['NT']),
-- Werden via On-Demand befüllt – RESTRICTED (in bible_verses_restricted, nur Chat-Kontext)
('NEUE',    'Neue evangelistische Übersetzung (NeÜ)', 2010, 'de', 'evangelikal', 'Christliche Verlagsgesellschaft', 'Karl-Heinz Vanheiden', 'https://bibel.github.io', 'protected',
  'Neue evangelistische Übersetzung (NeÜ bibel.heute), Karl-Heinz Vanheiden, CV Dillenburg.', 'Kommunikative, gut verständliche evangelikale Übersetzung in modernem Deutsch.', true, ARRAY['NT','AT']),
('NGUE',    'Neue Genfer Übersetzung', 2011, 'de', 'evangelisch', 'Genfer Bibelgesellschaft', 'Genfer Bibelgesellschaft', 'https://bibel.github.io', 'protected',
  'Neue Genfer Übersetzung, © Genfer Bibelgesellschaft.', 'Sinnorientierte, gut lesbare Übersetzung mit philologischer Sorgfalt.', true, ARRAY['NT','AT']),
('HFA',     'Hoffnung für Alle', 2015, 'de', 'evangelikal', 'Brunnen Verlag / Biblica', 'International Bible Society', 'https://bibel.github.io', 'protected',
  'Hoffnung für Alle, © Biblica/Brunnen Verlag.', 'Sehr freie, kommunikative Übersetzung in Alltagssprache.', true, ARRAY['NT','AT']),
('GNB',     'Gute Nachricht Bibel', 2018, 'de', 'ökumenisch', 'Deutsche Bibelgesellschaft', 'Ökumenische Übersetzergruppe', 'https://bibel.github.io', 'protected',
  'Gute Nachricht Bibel, revidierte Fassung 2018, © Deutsche Bibelgesellschaft.', 'Ökumenische, kommunikative Übersetzung in heutigem Deutsch.', true, ARRAY['NT','AT']),
('BB',      'BasisBibel', 2021, 'de', 'evangelisch', 'Deutsche Bibelgesellschaft', 'Deutsche Bibelgesellschaft', 'https://bibel.github.io', 'protected',
  'BasisBibel, vollständige Ausgabe 2021, © Deutsche Bibelgesellschaft.', 'Moderne Übersetzung mit kurzen Sätzen, für digitale Nutzung optimiert.', true, ARRAY['NT','AT']),
('LUT2017', 'Lutherbibel 2017', 2017, 'de', 'evangelisch-lutherisch', 'Deutsche Bibelgesellschaft', 'Lutherbibel-Revision 2017', 'https://bibel.github.io', 'protected',
  'Lutherbibel, revidiert 2017, © Deutsche Bibelgesellschaft.', 'Aktuelle Revision der Lutherbibel zum Reformationsjubiläum.', true, ARRAY['NT','AT']),
('MENG',    'Menge-Bibel', 1939, 'de', 'evangelisch', 'Deutsche Bibelgesellschaft', 'Hermann Menge', 'https://bibel.github.io', 'protected',
  'Menge-Bibel, Hermann Menge, letzte Hand 1939.', 'Philologisch präzise Übersetzung mit erklärenden Zusätzen.', true, ARRAY['NT','AT']),
('NLB',     'Neues Leben Bibel', 2017, 'de', 'evangelikal', 'SCM R. Brockhaus', 'Übersetzerteam SCM', 'https://bibel.github.io', 'protected',
  'Neues Leben. Die Bibel, © SCM R. Brockhaus.', 'Sinnorientierte, lebensnahe evangelikale Übersetzung.', true, ARRAY['NT','AT']),
('NWT',     'Neue-Welt-Übersetzung', 2018, 'de', 'Zeugen Jehovas', 'Watchtower Bible and Tract Society', 'Watchtower Translation Committee', 'https://bibel.github.io', 'protected',
  'Neue-Welt-Übersetzung der Heiligen Schrift, revidiert 2018, © Watchtower Bible and Tract Society.', 'Übersetzung der Zeugen Jehovas. Theologisch umstritten, in akademischer Bibelwissenschaft kritisch bewertet.', true, ARRAY['NT','AT']),
('TUR',     'Tur-Sinai (Die Heilige Schrift)', 1954, 'de', 'jüdisch', 'Holzgerlingen', 'Naftali Herz Tur-Sinai', 'https://bibel.github.io', 'protected',
  'Die Heilige Schrift, übers. v. Naftali Herz Tur-Sinai, Erstausgabe 1954.', 'Jüdische Übersetzung des Tanach (AT) mit hoher philologischer Qualität.', true, ARRAY['AT']),
('BR',      'Buber-Rosenzweig (Die Schrift)', 1929, 'de', 'jüdisch', 'Schneider/Lambert Schneider', 'Martin Buber, Franz Rosenzweig', 'https://bibel.github.io', 'protected',
  'Die Schrift, übers. v. Martin Buber u. Franz Rosenzweig, Berlin 1929 ff.', 'Wortwörtliche, hebräisch nahe Übersetzung des AT, sprachlich eigenwillig.', true, ARRAY['AT']),
('SLT1951', 'Schlachter 1951', 1951, 'de', 'evangelisch-reformiert', 'Genfer Bibelgesellschaft', 'Franz Eugen Schlachter', 'https://bibel.github.io', 'public_domain',
  'Schlachter-Bibel, Ausgabe 1951. Gemeinfrei.', 'Frühere Schlachter-Fassung, gemeinfrei.', true, ARRAY['NT','AT']),
('LU1545',  'Luther 1545', 1545, 'de', 'evangelisch-lutherisch', 'historisch', 'Martin Luther', 'https://bibel.github.io', 'public_domain',
  'Biblia, das ist die gantze Heilige Schrifft Deudsch, übers. v. M. Luther, Wittenberg 1545. Gemeinfrei.', 'Originale Lutherbibel von 1545 in frühneuhochdeutscher Sprache.', true, ARRAY['NT','AT']),
('HER',     'Herder-Bibel', 2005, 'de', 'römisch-katholisch', 'Verlag Herder', 'Herder-Übersetzerteam', 'https://bibel.github.io', 'protected',
  'Herder-Bibel, © Verlag Herder, Freiburg.', 'Katholische Übersetzung mit ausführlichen Erläuterungen.', true, ARRAY['NT','AT']),
('MNT',     'Münchener Neues Testament', 1998, 'de', 'römisch-katholisch', 'Düsseldorf', 'Münchener NT-Projekt', 'https://bibel.github.io', 'protected',
  'Münchener Neues Testament, hg. v. Josef Hainz, Düsseldorf 1998.', 'Sehr wortgetreue, am griechischen Text orientierte NT-Übersetzung.', true, ARRAY['NT']),
('PAT',     'Pattloch-Bibel', 1955, 'de', 'römisch-katholisch', 'Pattloch Verlag', 'Vinzenz Hamp, Meinrad Stenzel, Josef Kürzinger', 'https://bibel.github.io', 'protected',
  'Pattloch-Bibel, übers. v. V. Hamp, M. Stenzel, J. Kürzinger, Pattloch Verlag.', 'Katholische Familienbibel, weit verbreitete Nachkriegsübersetzung.', true, ARRAY['NT','AT']);
