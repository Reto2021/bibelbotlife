## Ziel
Jeder Kreuz-Post bekommt eine eigene, indexierbare URL `/kreuzwege/:slug`. Zusätzlich entstehen dedizierte Einstiegsseiten für die Domains `wegkreuze.ch`, `gipfelkreuze.ch` und – sofern verfügbar – `wegkreuze.de` sowie eine Alternative für `gipfelkreuze.de`.

## Phase C — SEO-Detailseiten für Kreuz-Posts

### 1. Datenbank: Slug-Spalte
- Migration fügt `slug text unique` zu `public.cross_posts` hinzu.
- Index auf `slug` für schnelles Lookup.
- `cross-post-submit` generiert den Slug serverseitig aus `place_label` (translitiert, Sonderzeichen entfernt, gekürzt auf ~40 Zeichen) + Kurz-ID (erste 4 Zeichen der UUID), z. B. `berguen-bravuogn-gipfelkreuz-a1b2`.
- Bestehende Posts werden per Backfill-Migration nachträglich mit Slugs versehen.

### 2. Route + Seite
- `src/App.tsx`: Route `/kreuzwege/:slug` hinzufügen (vor `/kreuzwege` platziert, damit React Router sie zuerst matched).
- `src/pages/Kreuzwege.tsx` erweitern: Wenn `slug`-Param vorhanden, Detail-Modus rendern statt Feed.
- Detail-Ansicht zeigt:
  - Vollbild-Foto mit Lightbox-Overlay
  - Ort, Land, Koordinaten
  - Karte mit zoombaren Steuerelementen und „In Karten öffnen“-Link
  - Story, Bibelzitat + Referenz
  - Reaktionsbuttons „Ein Gebet dafür“ / „Amen“ mit Zählern
  - Copy-Link-Button mit Toast-Bestätigung
  - Zurück-zum-Feed-Button

### 3. SEO-Metadaten pro Post
- `<SEOHead>` mit dynamischem Titel: „Wegkreuz / Gipfelkreuz in {place_label} · BibleBot.Life“
- Meta-Description aus Story-Ausschnitt (max. 160 Zeichen) oder Zitat.
- Canonical auf `https://biblebot.life/kreuzwege/{slug}`.
- JSON-LD:
  - `ImageObject` (Foto-URL, Geo-Koordinaten, Ort, Land)
  - `Place` (Name, Geo-Koordinaten)
  - `BreadcrumbList` (Home → Kreuzwege → Post)
- Alt-Texte auf Bildern aus Ort/Land generieren.

### 4. Deep-Linking migrieren
- `CrossCard.tsx` und `CrossDetailModal.tsx`: Share/Copy-Link verwenden `/kreuzwege/{slug}` statt `?post={id}`.
- `?post={id}` bleibt als Fallback-Redirect auf den Slug erhalten (für alte Links).
- Karussell auf der Startseite verlinkt ebenfalls auf die Slug-URL.

### 5. Sitemap
- Edge Function `generate-sitemap` erweitern: neuer Typ `crosses` listet alle freigegebenen Posts mit `slug`, `updated_at` und `changefreq="monthly"`, `priority="0.6"`.
- Statisches `scripts/generate-sitemap.ts` optional synchronisieren (Backup/Build-Zeit).
- Sitemap-Index um `/generate-sitemap?type=crosses` erweitern.

### 6. Regionen-Übersichtsseiten (optional, sobald genug Daten)
- Routen wie `/kreuzwege/schweiz`, `/kreuzwege/deutschland`, `/kreuzwege/oesterreich`.
- Automatisch generiert aus `country`-Werten der Posts.
- Eigener H1, kurzer Intro-Text, gefilterter Feed.

## Phase D — Domain-Landingpages

### 1. Vier dedizierte Seiten
- `/wegkreuze`: H1 „Wegkreuze aus der ganzen Welt“, kurzer Erklärungstext, gefilterter Feed.
- `/gipfelkreuze`: H1 „Gipfelkreuze & Bergkreuze“, eigener Text, Feed.
- `/wegkreuze-de`: H1 „Wegkreuze in Deutschland und weltweit“, leicht abgewandelter Text.
- `/gipfelkreuze-de`: H1 „Gipfelkreuze in Deutschland und weltweit“, eigener Text.
- Alle Seiten bekommen eigenen Title/Description/Canonical.

### 2. Domain-Verbindung
- Domains werden in Project Settings → Domains mit biblebot.life verknüpft.
- `biblebot.life` bleibt Primary Domain.
- Redirect-Mapping:
  - `wegkreuze.ch` → `/wegkreuze`
  - `gipfelkreuze.ch` → `/gipfelkreuze`
  - `wegkreuze.de` → `/wegkreuze-de` (sofern final verfügbar)
  - `gipfelkreuze.de` → **bereits registriert**, daher Alternative wählen, z. B.:
    - `gipfel-kreuze.de` → `/gipfelkreuze-de`
    - `bergkreuze.de` → `/gipfelkreuze-de`
    - `gipfelkreuze-schweiz.de` → `/gipfelkreuze`

### 3. Inhalt & CTA
- Jede Landingpage zeigt oben das lebendige Kreuzwege-Karussell.
- Prominenter „Dein Kreuz teilen“-Button öffnet den Upload-Dialog.
- Kurze SEO-Texte (2–3 Absätze) zu Geschichte/Bedeutung von Weg- bzw. Gipfelkreuzen.

## Domain-Verfügbarkeit (vorläufig geprüft via DNS)
- `wegkreuze.de`: Kein DNS-Eintrag → wahrscheinlich **frei**.
- `gipfelkreuze.de`: Bereits registriert (Strato-IP).
- Alternativen ohne DNS (wahrscheinlich frei):
  - `gipfel-kreuze.de`
  - `bergkreuze.de`
  - `gipfelkreuze-schweiz.de`
- **Empfohlene Aktion:** Vor dem Kauf bei einem Registrar final verifizieren.

## Traffic-Erwartung (Semrush-Daten)
- „Wegkreuz“ (DE): ~880 Suchen/Monat, Keyword-Difficulty 29 (leicht).
- „Flurkreuz“ (DE): ~720 Suchen/Monat, KD 23 (leicht).
- „Gipfelkreuz“ (CH): ~260 Suchen/Monat, KD 26 (leicht).
- Long-Tail-Hebel: „Gipfelkreuz Zugspitze“ (~90/Monat) und analog „Wegkreuz {Ort}“. Diese Seiten können mit geringem Wettbewerb ranken, sobald genug Posts vorhanden sind.
- Bild-SEO (ImageObject, Geo-Tags, Alt-Texte) erzeugt zusätzlichen organischen Traffic über Google Images.

## Technische Details
- Slug-Generierung erfolgt serverseitig in `cross-post-submit`; der Client sendet weiterhin nur `placeLabel`.
- RLS auf `cross_posts` bleibt geschlossen; Lesen läuft über `cross-posts-feed`, Schreiben über `cross-post-submit`/`cross-post-manage`.
- Neue Übersetzungsschlüssel für Detailseite, Regionen und Domain-Landingpages werden in `de.json` ergänzt und als EN-Fallback in die anderen 37 Sprachdateien übernommen.

## Reihenfolge
1. Slug-Spalte + Submit-Generierung + Backfill
2. Route `/kreuzwege/:slug` + Detail-Ansicht + SEO-Metadaten
3. Deep-Link-Migration (Copy-Link, Karussell, CrossCard)
4. Sitemap-Erweiterung
5. `/wegkreuze`, `/gipfelkreuze`, `/wegkreuze-de`, `/gipfelkreuze-de` Landingpages
6. Domain-Verbindung in Project Settings (du löst DNS/Kauf aus, ich konfiguriere Redirects/Canonicals)