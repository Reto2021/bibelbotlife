---
name: BasisBibel als Primärquelle
description: BasisBibel (modern, 2021) ist deutsche Primärreferenz für Chat & Suche
type: feature
---

# BasisBibel-Integration

- **Translation-Key**: `basisbibel` (Sprache `de`), in Tabelle `bible_verses` (31'170 Verse, alle 66 Bücher).
- **Erklärungen**: Tabelle `bible_explanations` (36'082 Stichwort-Erklärungen, mit Buch/Kapitel/Vers-Referenz).
- **Kapitel-Überschriften**: Tabelle `bible_chapter_headings` (3'985 Einträge, Position pro Kapitel).
- **Storage-Quelle**: `bible-imports/basisbibel.json` (privat).
- **Re-Import**: Edge Function `bible-import-basisbibel`, akzeptiert `{ mode: "all"|"verses"|"headings"|"explanations", offset, chapter_limit }`.

## Verwendung
- Chat (`bibelbot-chat`): BasisBibel ist Default für Deutsch (`DB_DEFAULT_BY_LANG.de = "basisbibel"`); System-Prompt weist explizit an, primär aus BasisBibel zu zitieren. Klassische Übersetzungen (Luther/Schlachter/Elberfelder) nur auf Nachfrage oder für liturgischen Kontext.
- Suche (`bible-search` / `BibleSearch.tsx`): BasisBibel als erste Option im Übersetzungs-Selector sichtbar.
