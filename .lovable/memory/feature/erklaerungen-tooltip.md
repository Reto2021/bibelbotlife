---
name: Bibel-Erklärungs-Tooltips
description: Sinngemäss umformulierte BasisBibel-Erklärungen als Tooltips im Chat und in BibleSearch
type: feature
---

## Urheberrecht
BasisBibel-Original-Erklärungen NIE an Client ausliefern.
- Tabelle `bible_explanations.explanation` = Original, nur service_role lesbar
- Spalte `bible_explanations.explanation_rewritten` = KI-Umformulierung (Lovable AI, gemini-2.5-flash-lite)
- View `bible_explanations_public` = einzige öffentlich lesbare Quelle

## Workflow
- Status pro Zeile: `pending` → `done` | `failed`
- Edge Function `bible-explanations-rewrite` arbeitet in Batches à 25 (8 parallel) und ruft sich selbst rekursiv auf
- Admin-Karte in `AdminDashboard.tsx` zeigt Fortschritt + manueller Re-Trigger

## Frontend
- Hook `useExplanationsInText(text)` → RPC `match_explanations_in_text`
- Komponente `BibleExplanationTooltip` (HoverCard auf Desktop, Popover auf Mobile)
- Quellenhinweis-Wortlaut: **"Erklärung sinngemäss."**
- Chat: `AssistantMessageBody` wrapped Markdown-Children
- BibleSearch: `VerseCard` wrapped Verstext
