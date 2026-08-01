## Ziel
Fotos vollständig sichtbar machen, Zitat-Overlays nicht mehr abschneiden und das Einbrennen optional/kontrolliert machen.

## 1. Foto als Overlay (Lightbox)
- Feed-Karte (`CrossCard.tsx`): Bild wird klickbar (Button-Semantik, `aria-label`, Tastatur-fokussierbar) und öffnet das Detail-Modal. Dafür bekommt `CrossFeed`/`Kreuzwege.tsx` eine `onOpen(id)`-Weitergabe, wie im Karussell schon vorhanden.
- `CrossDetailModal.tsx`: Bild oben wird als vollständige Ansicht dargestellt — `object-contain`, dunkler Hintergrund, max. Höhe ca. 70vh, kein Beschnitt. Klick auf das Bild öffnet eine reine Vollbild-Lightbox (Bild zentriert, Schliessen-Button, Klick/Escape schliesst).
- Feed-Vorschau bleibt beschnitten (4:3), damit das Raster ruhig bleibt; die volle Ansicht kommt aus dem Overlay.

## 2. Zitatlänge begrenzen
- Upload-Dialog: Zitatfeld erhält ein hartes Limit (max. 140 Zeichen) mit Zeichenzähler und Hinweis "kurze Zitate wirken am besten". Vers-Auswahl (`VersePicker`) kürzt zu lange Verse sauber am Wortende mit "…" und übernimmt die Referenz separat.
- Der volle Verstext bleibt in der Karte/Detailansicht als lesbarer Blockquote erhalten — gekürzt wird nur, was aufs Bild kommt.

## 3. Einbrennen verbessern und optional
- Standard: Einbrennen **aus**. Das Zitat wird als Text unter dem Bild angezeigt (bereits vorhanden) und im Overlay der Karte nicht mehr über das Motiv gelegt.
- Wer einbrennt, bekommt eine robustere Ausgabe in `burn-quote.ts`:
  - Zeilen dürfen bis 6 Zeilen, Fontgrösse skaliert weiter herunter, Untergrenze auf ~2.2% der Breite.
  - Wenn der Text danach noch nicht passt, wird er am Wortende mit "…" gekürzt statt überzulaufen.
  - Zitatblock nutzt Bildhöhe als Budget (max. ~38% der Höhe), Gradient wächst mit.
- Bestehende Posts mit überlangen eingebrannten Zitaten bleiben unverändert; in der Detailansicht sind sie durch `object-contain` nun ganz sichtbar.

## 4. Technische Details
- Betroffene Dateien: `src/components/kreuzwege/CrossCard.tsx`, `CrossFeed.tsx`, `CrossDetailModal.tsx`, `CrossUploadDialog.tsx`, `VersePicker.tsx`, `src/lib/burn-quote.ts`, `src/pages/Kreuzwege.tsx`.
- Neue i18n-Keys (Lightbox öffnen/schliessen, Zeichenzähler, Hinweis zum Einbrennen) in allen 38 Locale-Dateien, deutsche Schreibweise ohne ß.
- Keine Datenbank- oder Edge-Function-Änderungen nötig.
