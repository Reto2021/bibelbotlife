

# SEO-Verbesserung & Übersetzungen nachziehen

## Problem (aus dem Screenshot)

Google Search Console meldet **42 ungültige URLs** in der Sitemap. Die Ursache:
- Query-String-URLs (`?lng=de`, `?lng=en`, etc.) sind **kein gültiges Format** für Sitemaps
- Google erwartet entweder echte Pfade (`/de/`, `/en/`) oder `xhtml:link`-Alternates ohne separate `<url>`-Einträge pro Sprache
- Die Sitemap referenziert `biblebot.life`, Google crawlt aber `bibelbot.ch`

## Plan

### 1. Sitemap bereinigen — Sprachversionen entfernen
Die 36 `?lng=`-Einträge aus der Sitemap entfernen. Sprach-Alternates gehören **nur** als `hreflang`-Links in den `<head>` (ist bereits vorhanden in `index.html`). Die Sitemap enthält danach nur noch die echten Seiten:
- `/` (Startseite)
- `/for-churches`
- `/for-institutions`
- `/churches`
- `/impressum`
- `/datenschutz`
- `/login`

### 2. index.html — Domain & Meta anpassen
- `<html lang="de">` statt `"en"` (Hauptsprache ist Deutsch/Schweiz)
- Canonical und alle URLs auf `bibelbot.ch` umstellen (oder Redirect sicherstellen)
- Dynamischen `<title>` und `<meta description>` per Sprache vorbereiten (via i18n-Keys im `<head>` über eine React-Helmet-Komponente)

### 3. React-Helmet für dynamische Meta-Tags
`react-helmet-async` einbauen, damit jede Seite ihren eigenen `<title>` und `<meta description>` setzen kann — übersetzt via i18n.

### 4. Übersetzungskeys ergänzen
Neue i18n-Keys für SEO-Meta-Tags in `de.json` und `en.json`:
```json
"meta": {
  "homeTitle": "BibleBot – Dein persönlicher Bibel-Begleiter",
  "homeDesc": "BibleBot begleitet dich mit 5 Bibelübersetzungen...",
  "forChurchesTitle": "BibleBot für Gemeinden",
  "loginTitle": "Anmelden – BibleBot"
}
```
Dann via `translate-locale` Edge Function in alle 36 Sprachen übersetzen.

### 5. Fehlende Übersetzungen in neuen Seiten nachziehen
- `MeinBereich.tsx` und `MeinBereichHome.tsx` verwenden **keine** `useTranslation` — alle Texte sind hardcoded Deutsch
- i18n-Keys für den Mein-Bereich-Abschnitt ergänzen und in DE/EN eintragen, Rest via Translate-Funktion

### 6. robots.txt — Domain anpassen
Sitemap-URL auf korrekte Domain zeigen lassen.

---

### Technische Details

| Datei | Änderung |
|---|---|
| `public/sitemap.xml` | Nur echte Pfade, keine `?lng=` URLs |
| `public/robots.txt` | Sitemap-URL auf `bibelbot.ch` |
| `index.html` | `lang="de"`, Domain-URLs prüfen |
| `package.json` | `react-helmet-async` hinzufügen |
| `src/components/SEOHead.tsx` | Neue Komponente für dynamische Meta-Tags |
| `src/pages/Index.tsx` | `<SEOHead>` einbauen |
| `src/pages/ForChurches.tsx` | `<SEOHead>` einbauen |
| `src/pages/MeinBereich.tsx` | i18n nachrüsten |
| `src/pages/mein-bereich/MeinBereichHome.tsx` | i18n nachrüsten |
| `src/i18n/locales/de.json` | Meta-Keys + MeinBereich-Keys |
| `src/i18n/locales/en.json` | Meta-Keys + MeinBereich-Keys |

### Offene Frage
Ist `bibelbot.ch` die primäre Domain und `biblebot.life` ein Redirect — oder umgekehrt? Die Sitemap und index.html müssen auf dieselbe Domain zeigen wie die Google Search Console.

