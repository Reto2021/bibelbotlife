````text
Ziel
====
Auf der Startseite über dem „Kreuzwege“-Karussell einen festen Upload-Button als Overlay einbauen, der Besucher direkt zum Hochladen ihres Wegkreuzes führt.

Geplante Änderungen
===================
1. CrossMarquee-Overlay
   - Neuer schwebender Button (FAB-Style, unten rechts über dem Karussell).
   - Icon: Upload/Camera (Lucide), Text „Dein Wegkreuz teilen“.
   - Link zu /kreuzwege?upload=1.
   - Responsive: auf Mobile kompakt als Pill-Button, auf Desktop etwas grösser.
   - Sicheres Kontrastverhältnis über dem bewegten Karussell (z. B. primary-Hintergrund + Schatten + Abstand).

2. Deep-Link-Unterstützung auf /kreuzwege
   - Kreuzwege.tsx liest den Query-Parameter ?upload=1.
   - Beim Öffnen wird der CrossUploadDialog automatisch angezeigt.
   - Nach Abschluss/Abbruch wird der Parameter aus der URL entfernt.

3. Übersetzungen
   - Neue i18n-Keys:
     - crossways.marquee.uploadCta
     - crossways.marquee.uploadAria
   - Ausrollen in alle 38 Locale-Dateien (Englisch als Fallback, wo noch keine Übersetzung vorhanden).

4. Visuelles Finish
   - Animation: sanftes Einblenden beim Scroll-in-View.
   - Hover-/Focus-States für Accessibility.
   - Keine Verdeckung der Karussell-Karten sicherstellen.

Akzeptanzkriterien
==================
- Button ist auf der Startseite dauerhaft über dem Karussell sichtbar.
- Klick öffnet /kreuzwege und zeigt direkt den Upload-Dialog.
- Text ist in Deutsch und allen unterstützten Sprachen vorhanden.
- Build bleibt grün, keine visuelle Überlappung mit Karussell-Inhalten.
````