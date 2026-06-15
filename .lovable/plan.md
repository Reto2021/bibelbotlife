# Erklärungs-Tooltips mit KI-Umformulierung

Ziel: BasisBibel-Erklärungen urheberrechtssicher als Tooltips im Chat und in der Bibelsuche anzeigen. KI formuliert einmalig sinngemäss um, Ergebnis wird persistent gespeichert.

## 1. DB-Migration

Erweitere `bible_explanations`:
- `explanation_rewritten TEXT` — sinngemässe KI-Version (öffentlich auslieferbar)
- `rewritten_at TIMESTAMPTZ` — Zeitstempel
- `rewrite_status TEXT` — `pending` | `done` | `failed` (default `pending`)

RLS-Anpassung: Öffentliche Leser erhalten nur Zeilen mit `rewrite_status = 'done'` und sehen nur die umformulierte Spalte. Das Original (`explanation`) bleibt service_role-only.

Konkret: Neue View `public.bible_explanations_public` mit Spalten `id, verse_id, book, chapter, verse, keyword, explanation_rewritten, source` — Frontend liest nur diese View.

## 2. Edge Function: `bible-explanations-rewrite`

Batch-Worker:
- Liest 50 Einträge mit `rewrite_status = 'pending'` pro Aufruf
- Ruft Lovable AI (`google/gemini-2.5-flash-lite`) mit kompaktem System-Prompt:
  - "Formuliere die folgende Bibelerklärung sinngemäss in eigenen Worten neu. Max. 2 Sätze, sachlich, Schweizer Deutsch (kein ß). Behalte die Kernaussage, ändere Satzbau und Wortwahl substantiell. Gib nur den umformulierten Text zurück, keine Einleitung."
- Schreibt Ergebnis in `explanation_rewritten`, setzt Status `done`
- Bei Fehler: Status `failed` + `error_message`
- Ruft sich selbst rekursiv neu auf (`fetch` auf eigene URL) bis `pending = 0` → läuft autonom durch
- Schutz vor Endlosschleifen: Max-Iterationen-Header oder Timestamp-Check

Auto-Start: Migration enthält am Ende einen `pg_net.http_post` Aufruf auf die Function → Job startet direkt nach Migration.

Admin-UI: Kleine Status-Karte in `/admin/AdminDashboard.tsx` mit Fortschritt (`done` / `total`), Re-Trigger-Button.

## 3. Tooltip-Komponente

Neue Datei `src/components/BibleExplanationTooltip.tsx`:
- Nutzt `HoverCard` (Radix, bereits im Projekt: `src/components/ui/hover-card.tsx`)
- Props: `keyword`, `verseRef` (optional zur Eingrenzung)
- Lazy-Load via `useQuery` aus `bible_explanations_public` (Cache: 24h)
- Auf Mobile: Tap statt Hover (Popover-Fallback)
- Render: Keyword unterstrichen (dezent, `decoration-dotted text-primary/80`)
- Tooltip-Inhalt: Umformulierter Text + kleiner Hinweis "Erklärung sinngemäss." am Ende

## 4. Integration in Chat (`BibelBotChat.tsx`)

- Nach Empfang einer Bot-Antwort: Text-Parser scannt nach Schlüsselwörtern aus `bible_explanations_public`
- Performance: Lade einmalig pro Session eine Liste der ~3'000 häufigsten Keywords in einen In-Memory-Trie (oder einfacher: nimm nur Keywords, die im aktuellen Antworttext UND in der DB existieren → ein RPC pro Antwort)
- Ersetze Vorkommen mit `<BibleExplanationTooltip keyword="…">…</BibleExplanationTooltip>`
- Nur erste Vorkommen pro Wort markieren, um Tooltip-Spam zu vermeiden

## 5. Integration in BibleSearch (`BibleSearch.tsx`)

- Gleicher Tooltip-Wrapper auf den angezeigten Versen
- Wenn ein Vers angezeigt wird: Hole zugehörige Erklärungen via `verse_id`
- Markiere die in den Erklärungen genannten Keywords im Verstext

## 6. Memory-Update

Neue Datei `mem://feature/erklaerungen-tooltip`:
- Hinweis: BasisBibel-Original NIE an Client ausliefern
- Quellenhinweis-Wortlaut: "Erklärung sinngemäss."
- Workflow: pending → rewrite → done, Auto-Trigger via pg_net

---

## Technische Details

**Modell-Wahl:** `google/gemini-2.5-flash-lite` — günstigstes Modell, ausreichend für kurze Umformulierungen. ~36'082 Einträge × ~200 Token total ≈ wenige CHF einmalig.

**Performance Chat-Keywords:** Statt In-Memory-Trie nutze Postgres-Funktion `match_explanations_in_text(text)` → schickt den Antworttext an DB, DB matcht Keywords via Index, liefert Treffer zurück. Cache pro Antwort-Hash.

**RLS-Sicherheit:**
- `bible_explanations` Tabelle: nur `service_role` darf lesen (Original geschützt)
- `bible_explanations_public` View: `SECURITY INVOKER` mit Filter `WHERE rewrite_status = 'done'`, exposed nur umformulierte Spalte
- GRANT SELECT auf View an `anon, authenticated`

**Idempotenz:** Re-Run der Edge Function überspringt `done`-Einträge. Re-Trigger im Admin setzt einzelne Einträge zurück auf `pending`.

**Auto-Trigger nach Migration:** Migration enthält `SELECT net.http_post(...)` ans Ende → startet Worker. Worker ruft sich rekursiv selbst auf, bis fertig.

**Rate-Limits:** 50 Calls pro Batch, kein expliziter Delay nötig (Lovable AI Gateway handhabt). Bei 429 → exponential backoff im Worker.

---

## Reihenfolge der Umsetzung

1. Migration (Spalten + View + RLS + pg_net-Trigger am Ende)
2. Edge Function `bible-explanations-rewrite` deployen
3. Migration ausführen → Worker startet automatisch
4. `BibleExplanationTooltip.tsx` bauen
5. Chat-Integration
6. BibleSearch-Integration
7. Admin-Status-Karte
8. Memory speichern

Klar zum Bauen?
