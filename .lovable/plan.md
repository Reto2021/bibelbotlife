

## Plan: BibleBot-Chat als Overlay im Messeplaner

### Problem
Der Chat existiert nur auf der Startseite (als `ChatHero` inline). Im Dashboard/Messeplaner gibt es keinen Chat — Nutzer verlieren ihren Kontext, wenn sie zur Startseite navigieren müssen.

### Lösung
Die bestehende `BibelBotChat`-Komponente (floating Overlay, bottom-right) wird auch im Dashboard-Layout eingebunden. Sie ist bereits als eigenständiges Widget gebaut (FAB-Button → Overlay-Card) und braucht keine Anpassung.

### Umsetzung

**1 Datei ändern: `src/pages/Dashboard.tsx`**
- `BibelBotChat` importieren und im Dashboard-Layout rendern (neben `<Outlet />`)
- Das Widget erscheint als Floating-Button unten rechts, genau wie es auf der Startseite früher funktioniert hat
- Chat-Kontext (Messages) bleibt im localStorage erhalten — kein Datenverlust beim Seitenwechsel

### Ergebnis
- Chat-Button (💬) schwebt im Messeplaner unten rechts
- Klick öffnet das Chat-Overlay ohne Seitenwechsel
- Nutzer kann während der Gottesdienst-Planung Bibelfragen stellen, ohne Kontext zu verlieren
- Bestehende `openBibleBotChat()`-Events funktionieren auch im Dashboard

