---
name: Restricted Bible Translations
description: Lizenzkonforme Behandlung von urheberrechtlich geschützten Bibel-Übersetzungen (NIV, BasisBibel, Schlachter 2000, Einheitsübersetzung, Elberfelder 2006)
type: feature
---

# Geschützte Bibelübersetzungen

## Codes (translation in bible_verses_restricted)
- **NIV** — New International Version 2011, ©Biblica (EN-Default)
- **basisbibel** — BasisBibel 2021, © Deutsche Bibelgesellschaft (DE-Default)
- **schlachter2000** — Schlachter 2000, © Genfer Bibelgesellschaft
- **EU** — Einheitsübersetzung 2016, © Kath. Bibelwerk
- **ELB** — Elberfelder 2006, © SCM R. Brockhaus

## Architektur

Diese Übersetzungen liegen **ausschliesslich** in `bible_verses_restricted` (RLS service_role-only).
NIE in `bible_verses` (öffentlich lesbar). Auslieferung an Frontend nur über:

1. **`search_bible_verses_restricted(query, translation, ..., limit ≤ 50)`** — FTS mit hartem Slice-Limit
2. **`get_restricted_verse_snippet(translation, book_number, chapter, verse_start, verse_end ≤ 30)`** — Einzelzitat-Lookup

Beide RPCs sind SECURITY DEFINER, an anon/authenticated/service_role granted. Direkter Tabellenzugriff via `from('bible_verses_restricted')` ist nur dem service_role möglich (Edge Functions).

## Frontend-Pflicht: Quellennachweis

Bei JEDER Anzeige geschützter Verse muss `<RestrictedTranslationFooter translation={code} />` gerendert werden.
Der Footer lädt automatisch die `citation` aus `bible_translation_meta`.

## Chat (bibelbot-chat)

- `RESTRICTED_DB_TRANSLATIONS` Set in der Edge Function steuert Tabellen-Routing in `lookupVerseFromDb`
- System-Prompt enthält Pflichtblock "Geschützte Übersetzungen wörtlich zitieren + Quellennachweis"
- NIV ist `DB_DEFAULT_BY_LANG.en`
- Thematische Suche merged Ergebnisse aus beiden RPCs

## BibleSearch (Frontend)

`bible-search` Edge Function ruft beide RPCs parallel auf und merged nach Rank.
`expandQuery` ist sprachabhängig (de/en/fr/es), generiert sprachpassende tsquery-Synonyme.

## Wichtig — niemals tun

- Geschützte Translation-Codes in `bible_verses` (öffentlich) einfügen
- `bible_verses_restricted` ohne Slice-Limit nach aussen exponieren
- Verse aus geschützten Übersetzungen paraphrasieren (verändert theologische Bedeutung)
- Citation/Footer weglassen
