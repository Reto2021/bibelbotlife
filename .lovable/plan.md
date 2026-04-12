

## Plan: Einstiegs-Chips für Alltags-Nutzer optimieren

### Problem
Die aktuellen Topic-Chips sind stark auf Sorgen und religiöse Themen ausgerichtet (Herzschmerz, Angst, Burnout, Glaubenszweifel...). ~80% der Besucher kommen ohne akutes Anliegen und finden keinen niederschwelligen Einstieg.

### Lösung
Die Chip-Liste neu strukturieren in **zwei Gruppen**, wobei die ersten ~8 Chips bewusst neugierig-leicht sind und die tieferen Themen danach kommen.

**Neue "leichte" Einstiegs-Chips (vorne platziert):**

| Emoji | Key | Titel (DE) | Prompt-Idee |
|-------|-----|-----------|-------------|
| 🤔 | `namequiz` | Was bedeutet dein Name? | (existiert bereits) |
| ☕ | `dailywisdom` | Weisheit für heute | "Gib mir einen kurzen, ermutigenden Gedanken für meinen Tag" |
| 🎲 | `funfact` | Wusstest du schon? | "Erzähl mir eine überraschende Tatsache aus der Bibel" |
| 💡 | `lifehack` | Lebenstipp | "Welcher biblische Tipp hilft im Alltag mit Familie und Beruf?" |
| 🌟 | `strengths` | Deine Stärken | "Hilf mir, meine persönlichen Stärken zu entdecken" |
| 🎡 | `lifewheel` | Lebensrad | (existiert bereits) |
| 👨‍👩‍👧 | `family` | Familie & Alltag | "Wie kann ich meiner Familie mehr Wertschätzung zeigen?" |
| 😴 | `relax` | Zur Ruhe kommen | "Ich brauche einen Moment der Ruhe. Hilf mir abzuschalten" |

Danach folgen die bestehenden tieferen Themen (prayer, heartbreak, anxiety, etc.).

### Umsetzung

1. **`ChatHero.tsx`** — `TOPIC_CHIPS` Array neu ordnen: leichte Chips zuerst, tiefere Themen danach
2. **`EntryTiles.tsx`** — `allTiles` Array analog umordnen und neue Tiles hinzufügen
3. **`de.json` + `en.json`** — Neue `tiles.*` Keys für Titel, Beschreibung und Prompt-Varianten
4. **Alle anderen Locale-Dateien** — Per Script übersetzen (34 Sprachen)

### Betroffene Dateien
- `src/components/ChatHero.tsx` (TOPIC_CHIPS Reihenfolge + neue Einträge)
- `src/components/EntryTiles.tsx` (allTiles Reihenfolge + neue Einträge)
- `src/i18n/locales/de.json`, `en.json` + 32 weitere Locale-Dateien

