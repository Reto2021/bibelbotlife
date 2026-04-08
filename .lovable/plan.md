
# Gemeinde-Branding: Vollständige Umsetzung

## 1. DB-Migration – Neue Spalten auf `church_partners`
- `custom_bot_name` (text, nullable) – z.B. "ReformierterBot Zürich"
- `primary_color` (text, nullable) – z.B. "#2E7D32"
- `secondary_color` (text, nullable) – optional

Keine neuen Tabellen, keine RLS-Änderungen nötig (bestehendes SELECT-Policy reicht).

## 2. Gemeinde-Kontext-Hook: `useChurchBranding()`
**Neue Datei**: `src/hooks/use-church-branding.ts`
- Liest Slug aus localStorage (`biblebot-church`)
- Fetcht `name`, `logo_url`, `custom_bot_name`, `primary_color`, `secondary_color` aus `church_partners`
- Cached mit React Query (kein Re-Fetch bei jedem Render)
- Gibt `{ botName, logoUrl, primaryColor, churchName, churchSlug }` zurück

## 3. Dynamische Farbanpassung
- In `App.tsx` oder einem Wrapper: Wenn `primary_color` gesetzt, CSS-Custom-Properties (`--primary`) dynamisch überschreiben
- Nur HSL-Umrechnung nötig (hex → hsl)

## 4. Logo im Chat-Header
- `ChatHero.tsx`: Wenn Gemeinde aktiv, Gemeinde-Logo + `custom_bot_name` statt "BibelBot" im oberen Bereich

## 5. Splash-Screen erweitern
- `SplashScreen.tsx`: `custom_bot_name` statt "BibelBot.Life" anzeigen, wenn vorhanden

## 6. Direktlink zur Gemeindeseite
- Im ChurchBanner (bereits vorhanden) einen Link zu `/church/:slug` hinzufügen
- Im Chat: Nach dem Login-Hint einen dezenten "Deine Gemeinde"-Link einblenden

## 7. Testdaten aktualisieren
- `reformierte-zuerich`: `custom_bot_name = "ReformierterBot"`, `primary_color = "#1B3A5C"`
- `vineyard-bern`: `custom_bot_name = "VineyardBot"`, `primary_color = "#2E7D32"`

## Betroffene Dateien
- DB-Migration (neue Spalten)
- `src/hooks/use-church-branding.ts` (neu)
- `src/components/SplashScreen.tsx` (Bot-Name)
- `src/components/ChatHero.tsx` (Logo + Bot-Name im Header)
- `src/components/ChurchBanner.tsx` (Direktlink)
- `src/App.tsx` (Farb-Override)

## Verwaltung
Kein Admin-UI – Gemeindedaten werden direkt über Lovable Cloud Backend gepflegt.
