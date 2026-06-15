## Ziel

NIV (New International Version, ©Biblica) als englische Primärquelle für Chat und BibleSearch — lizenzkonform via `bible_verses_restricted` (kein offener Volltext-Zugriff, immer mit Quellennachweis "NIV ©Biblica").

## Lizenz-Strategie

- NIV-Volltext liegt **nur** in `bible_verses_restricted` (service_role-only RLS).
- Auslieferung an Frontend ausschliesslich über RPC `get_restricted_verse_snippet`.
- Pro Antwort/Anzeige: Copyright-Footer "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission."
- Verse-Limit pro RPC-Call: **von 7 auf 30 anheben** (deckt ein ganzes Kapitel ab — Standard für BibleSearch-Kapitelansicht). Bleibt Scraping-Schutz, da Tabelle selbst nicht direkt lesbar.

## Schritte

### 1. Import-Pipeline
- Neue Edge Function `bible-import-niv` (analog `bible-import-basisbibel`):
  - Liest `niv_chapters.json` aus Storage-Bucket `bible-imports`.
  - Parst pro Vers (ID-Format `GEN.1.1` → book/chapter/verse mapping).
  - Schreibt in `bible_verses_restricted` mit `translation='NIV'`, `language='en'`, `source_url` auf biblica.com.
  - Idempotent via ON CONFLICT (translation, book_number, chapter, verse).
  - Kapitelüberschriften (`headings`) in `bible_chapter_headings`.
- Hochladen: JSON nach `bible-imports/niv_chapters.json`, Edge Function einmalig triggern.

### 2. DB-Migration
- `get_restricted_verse_snippet`: Limit von 7 auf 30 erhöhen.
- `bible_translation_meta`: NIV-Eintrag (name, language='en', copyright_notice, source_url, is_restricted=true).
- Keine Public-Grants auf `bible_verses_restricted` — bleibt service_role.

### 3. Chat-Integration (`bibelbot-chat`)
- Wenn UI-Sprache `en`: NIV als Default-Translation für Versabruf.
- Versabruf via `get_restricted_verse_snippet` (RPC), nicht via `bible_verses`.
- System-Prompt erweitern: bei englischen Antworten NIV als Primärquelle, Copyright-Footer am Ende der Antwort einfügen, wenn NIV-Vers zitiert wurde.
- Direktzitate paraphrasieren wir **nicht** — NIV-Verse werden wörtlich zitiert (das ist legitim und theologisch sauber, anders als die BasisBibel-Erklärungen, die wegen 36k Einträgen umformuliert wurden).

### 4. BibleSearch-Integration
- NIV in Translation-Dropdown verfügbar machen, aber nur wenn `language='en'` aktiv.
- Kapitelansicht: Verse via RPC `get_restricted_verse_snippet` laden (statt direkter Tabellen-Query).
- Volltext-Suche (FTS) auf NIV: **nicht** öffentlich. Stattdessen via Edge Function `bible-search-restricted`, die intern sucht und nur Treffer-Slices (max 30 Verse) zurückgibt.
- Copyright-Footer unter jedem NIV-Treffer/Kapitel.

### 5. Frontend-Komponente
- `src/components/RestrictedTranslationFooter.tsx`: Wiederverwendbarer Copyright-Hinweis (NIV-Text aus `bible_translation_meta.copyright_notice`).
- In `BibleSearch.tsx` und `BibelBotChat.tsx` rendern, sobald NIV im aktuellen Resultat enthalten ist.

### 6. Memory
- `mem://feature/niv-integration`: Lizenz-Regeln, Copyright-Footer-Pflicht, Restricted-Pfad-Workflow.

## Reihenfolge

1. Migration (Limit 30, NIV-Meta-Eintrag)
2. Edge Function `bible-import-niv` + JSON-Upload + Trigger
3. Edge Function `bible-search-restricted` (NIV-FTS)
4. `bibelbot-chat` System-Prompt + RPC-Routing für `lang='en'`
5. `RestrictedTranslationFooter` Komponente
6. `BibleSearch.tsx` Integration
7. Memory-File

## Was wir bewusst NICHT tun

- **Keine** KI-Paraphrase aller NIV-Verse (anders als BasisBibel-Erklärungen). Paraphrasierte Bibelverse sind theologisch heikel — verändert Bedeutung.
- **Kein** direkter Public-Read auf `bible_verses_restricted`.
- **Keine** Aufnahme in `bible_verses` (öffentliche Tabelle).
