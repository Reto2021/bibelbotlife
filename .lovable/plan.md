## Antworten auf deine 4 Fragen

**1. UGC weiter nach oben?** Ja. Das Karussell steht heute nach den Entry-Tiles (ca. Position 3). Ein lebendiger Foto-Stream ist das stärkste Social-Proof-Element und gehört direkt unter den Hero.

**2. wegkreuze.ch / gipfelkreuze.ch?** Technisch ja: beide Domains lassen sich in Project Settings → Domains auf dasselbe Projekt zeigen. Sinnvoll nur mit eigenen Landingpages statt reiner Weiterleitung – sonst verpufft das SEO-Potenzial (identischer Content = Duplicate Content).

**3. SEO-Potenzial?** Real, aber Nische: Suchanfragen wie "Wegkreuze Schweiz", "Gipfelkreuz + Bergname", "Flurkreuz Bedeutung" haben geringes Volumen, aber sehr hohe Relevanz und kaum Wettbewerb. Die Bild-/Ortsdaten (Ort, Land, Koordinaten, Bibelzitat) sind ideal für Bild-SEO und lokale Long-Tail-Seiten. Grösster Hebel: pro Kreuz eine eigene, indexierbare URL statt nur `?post=`-Parameter.

**4. Eigene Bilder ändern/löschen?** Geht heute gar nicht – die Zuordnung existiert nur als `session_id` in der Datenbank, wird aber nie an den Client zurückgegeben. Das ist die wichtigste Lücke.

---

## Plan

### A. UGC-Platzierung (Startseite)
- Karussell direkt unter den Hero verschieben (vor Entry-Tiles).
- Kompakte Überschrift + Untertitel + CTA "Dein Wegkreuz teilen" darüber, damit klar ist, was man sieht.
- Mobile: Höhe leicht reduzieren, damit der Fold nicht komplett vom Karussell belegt wird.

### B. "Meine Kreuze" – bearbeiten & löschen
- Neue Edge Function `cross-post-manage` (Aktionen `list`, `update`, `delete`), autorisiert über die im Browser gespeicherte `session_id`; bei eingeloggten Nutzern zusätzlich über `user_id`.
- Editierbar: Ortsbezeichnung, Story, Zitat + Referenz, Anonym-Flag. Bild selbst wird nicht nachträglich editiert – stattdessen "löschen und neu hochladen" (inkl. Storage-Cleanup).
- Neuer Bereich `/kreuzwege/meine` (Tab auf der Kreuzwege-Seite): Liste der eigenen Beiträge mit Bearbeiten-Dialog und Löschen (mit Bestätigung).
- Änderungen laufen erneut durch die Text-Moderation.
- Hinweis in der Upload-Bestätigung: "Du kannst deinen Beitrag später bearbeiten oder löschen – solange du denselben Browser nutzt." Für dauerhafte Zuordnung Login empfehlen.

### C. SEO-Ausbau Kreuzwege
- Indexierbare Detail-URLs `/kreuzwege/:slug` (Slug aus Ort + Kurz-ID), Modal bleibt für In-Feed-Klicks.
- Pro Kreuz: eigener Title/Description, `ImageObject` + `Place`-JSON-LD, Alt-Texte aus Ort/Land.
- Länder-/Regionen-Übersichtsseiten `/kreuzwege/schweiz` etc., sobald genug Beiträge vorhanden sind.
- Sitemap-Generator um alle freigegebenen Kreuz-URLs erweitern.

### D. Domains
- `wegkreuze.ch` und `gipfelkreuze.ch` auf das Projekt verbinden.
- Zwei dedizierte Landingpages (`/wegkreuze`, `/gipfelkreuze`) mit eigenem H1, eigenem Text und gefiltertem Feed; Domain-Root zeigt auf die passende Seite.
- Canonical jeweils auf die eigene Seite; `biblebot.life` bleibt Primary für die App.

### Technische Details
- DB: Index auf `cross_posts(session_id)`, optionale Spalte `user_id`, `updated_at`; RLS bleibt geschlossen, alle Schreibzugriffe nur über Edge Functions.
- Delete entfernt Storage-Objekt und Zeile; Interaktions-Zähler werden per Cascade mitgelöscht.
- Neue Texte in allen 38 Sprachdateien.

### Reihenfolge
1. A + B (sichtbarer Nutzen, schliesst die Lücke)
2. C (SEO-Fundament)
3. D (Domains, sobald du die DNS-Einträge setzen kannst)
