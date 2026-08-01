## Kreuzwege — Kreuze weltweit sammeln

Neue Community-Seite `/kreuzwege` in BibleBot: Nutzer:innen laden Fotos von Kreuzen (Wegrand, Bergspitze, Kirche) hoch, mit Ort und kurzer Geschichte. Freigegebene Beiträge erscheinen in Feed und Karte. Interaktion bewusst still: „Ein Gebet dafür“ (Amen) + Teilen, keine Kommentare im MVP.

### Nutzerfluss
1. Seite zeigt Umschalter **Feed | Karte**, darüber Button „Kreuz hinzufügen“.
2. Upload-Dialog: Foto (Pflicht), Ortsbezeichnung, optional „Standort verwenden“ (Geolocation) oder Punkt auf Karte setzen, kurze Geschichte (max. 500 Zeichen), Anzeigename oder anonym, Einverständnis-Checkbox (eigenes Foto, keine erkennbaren Personen).
3. Nach dem Absenden: Hinweis „Wird geprüft und dann veröffentlicht“ — nichts erscheint sofort öffentlich.
4. Feed: Karten mit Bild, Ort, Geschichte, Gebets-Zähler; Karte: Marker mit Vorschau-Popup, Filter „In meiner Nähe“ (Distanzsortierung im Client).
5. „Ein Gebet dafür“ zählt einmalig pro Gerät (localStorage, analog Gebetswand).

### Moderation
- Admin-Seite `/admin/kreuzwege` (gleicher Aufbau wie Gebets-Moderation): Filter Ausstehend / Freigegeben / Abgelehnt, Bildvorschau, Freigeben / Ablehnen mit Grund, Löschen.
- Verlinkung im Admin-Dashboard neben der Gebets-Moderation.

### Technische Umsetzung
- **Tabelle** `public.cross_posts`: `id`, `image_path`, `place_label`, `country`, `lat`, `lng`, `story`, `author_name`, `is_anonymous`, `session_id`, `status` (`pending|approved|rejected`), `rejection_reason`, `prayer_count`, `created_at`, `moderated_at`, `moderated_by`. GRANTs für `anon`/`authenticated`/`service_role` in derselben Migration.
- **RLS**: Insert für anon/authenticated nur mit `status = 'pending'`; Select öffentlich nur über Security-Definer-Funktion `get_approved_cross_posts()` (liefert keine Session-IDs); Update/Delete nur Admins via `has_role`. Validierungs-Trigger für Längenlimits, Lat/Lng-Bereiche und erzwungenen `pending`-Status.
- **Zähler**: `increment_cross_prayer_count(post_id)` als Security-Definer-Funktion, analog `increment_prayer_count`.
- **Storage**: privater Bucket `cross-photos` mit Policy „Insert für authenticated + anon in eigenen Pfad“, Auslieferung freigegebener Bilder über signierte URLs; Client komprimiert vor Upload (max. 1600px, JPEG) und begrenzt auf 5 MB.
- **Karte**: `react-leaflet` mit OpenStreetMap-Tiles — kein API-Key, kein Kartendienst-Konto nötig, passt zum werbefreien/datensparsamen Versprechen. Lazy-geladen, damit die Bundle-Grösse der Landing unberührt bleibt.
- **Dateien**: `src/pages/Kreuzwege.tsx`, `src/components/kreuzwege/{CrossUploadDialog,CrossFeed,CrossMap,CrossCard}.tsx`, `src/hooks/use-cross-posts.ts`, `src/pages/admin/CrossModeration.tsx`, Routen in `src/App.tsx`, Navigationseintrag in `SiteHeader`.
- **SEO/i18n**: `SEOHead` mit eigenem Titel/Description, deutsche Texte in `src/i18n/locales/de.json`, englische Fallbacks in `en.json`.

### Bewusst nicht im MVP
Kommentare, Likes, Follower, Push-Benachrichtigungen bei neuen Kreuzen, automatische Bildmoderation per KI (kann als zweiter Schritt vor die Queue geschaltet werden).
