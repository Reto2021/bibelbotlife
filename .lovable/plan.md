

# Daily-Impulse Prompt verbessern: Grammatik & Schweizer Hochdeutsch

## Problem
Die KI generiert grammatikalisch falsche Sätze wie "Vergessen Gottes deine Fehler wirklich?" — unnatürliche Wortstellung, fehlerhafte Genitiv-Konstruktionen.

## Ursache
Der SYSTEM_PROMPT (Zeile 39-57) enthält keine expliziten Grammatikregeln für den Teaser. Das Modell (`gemini-2.5-flash-lite`) neigt bei kurzen, "packenden" Sätzen zu unnatürlichen Konstruktionen.

## Änderungen

### 1. SYSTEM_PROMPT erweitern (Zeile 39-57)
Neue Regeln zum bestehenden Regeln-Block hinzufügen:

- **Grammatikregel für Teaser**: "Der Teaser muss grammatikalisch korrektes Schweizer Hochdeutsch sein. Natürliche Satzstellung: Subjekt-Verb-Objekt. KEINE invertierten Genitiv-Konstruktionen wie 'Vergessen Gottes' — korrekt wäre 'Vergibt Gott wirklich?'"
- **Fragesätze-Regel**: "Fragesätze beginnen mit dem Verb oder einem Fragewort (Wer, Was, Warum, Wie). Beispiele: 'Vergibt Gott wirklich alles?' (NICHT 'Vergeben Gottes alles?'), 'Warum lohnt sich Vertrauen?' (NICHT 'Lohnen des Vertrauens sich?')"
- **Positive Beispiele** im Prompt für Teaser-Stil:
  - "Warum Vergebung dein Leben verändert"
  - "Gott vergisst – aber wie geht das?"
  - "Drei Worte, die alles verändern"

### 2. Modell upgraden (Zeile 111)
Von `google/gemini-2.5-flash-lite` auf `google/gemini-2.5-flash` wechseln — bessere Sprachqualität bei minimalem Mehraufwand, weniger Grammatikfehler.

### 3. Grammatik-Postprocessing (optional, nach fixSpelling)
Einfache Prüfung auf bekannte Fehlmuster wie doppelten Genitiv oder falsche Verbformen, die per Regex korrigiert werden können.

## Betroffene Datei
- `supabase/functions/daily-impulse/index.ts` — SYSTEM_PROMPT + Modell-Zeile

