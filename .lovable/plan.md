

# Mehr Abwechslung bei Tile-Antworten

## Problem
Gleiche Tile → gleicher Prompt → ähnliche Antwort. Die KI hat keinen Kontext, dass der Nutzer dasselbe Thema schon mal gewählt hat.

## Lösung: Varianz-Instruktion im System-Prompt + Kontext-Hinweis

### 1. Temperature erhöhen (Edge Function)
**Datei**: `supabase/functions/bibelbot-chat/index.ts`

`temperature: 1.0` explizit setzen im API-Call, damit das Modell kreativer antwortet.

### 2. Varianz-Anweisung im System-Prompt
Ergänzung im `SYSTEM_PROMPT`:

> «Wenn ein Nutzer ein allgemeines Thema anspricht (z.B. Taufe, Gebet, Angst), wähle JEDES MAL einen anderen Einstieg: andere Bibelstelle, andere Perspektive, anderer Ton (mal persönlich, mal historisch, mal herausfordernd, mal tröstend). Wiederhole dich nie.»

### 3. Zufällige Prompt-Varianten (optional, mehr Aufwand)
In `EntryTiles.tsx`: Pro Tile 2–3 leicht unterschiedliche Prompt-Varianten definieren und zufällig eine wählen. Z.B. für "Taufe":
- Variante A: «Was bedeutet die Taufe?»
- Variante B: «Erzähl mir von der Taufe in der Bibel – überrasche mich!»
- Variante C: «Warum lassen sich Menschen taufen?»

### Empfehlung
Schritte 1 + 2 sind schnell und wirkungsvoll. Schritt 3 bringt die grösste Abwechslung, ist aber mehr Arbeit (i18n-Keys pro Variante).

## Betroffene Dateien
- `supabase/functions/bibelbot-chat/index.ts` (temperature + Prompt-Ergänzung)
- Optional: `src/components/EntryTiles.tsx` + `de.json` / `en.json` (Prompt-Varianten)

