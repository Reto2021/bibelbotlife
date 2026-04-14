

## Fix: Ressourcen-Vorschläge klickbar machen in den Zeremonien-Writern

### Problem
Die Ressourcen-Vorschläge (z.B. "prayer", "Korinther") im Zeremonien-Writer werden als statische Karten angezeigt. Beim Klick passiert nichts — die Details (Inhalt, Text, Bibelstelle) können nicht geöffnet werden.

### Lösung
Jede Ressourcen-Karte erhält einen Expand/Collapse-Mechanismus, der beim Klick den vollständigen Inhalt der Ressource anzeigt.

### Änderungen

**1. `src/pages/mein-bereich/CeremonyWriter.tsx`** (Zeilen 686-700)
- Die statischen `<div>`-Karten im "Vorschläge aus der Bibliothek"-Bereich werden zu klickbaren, aufklappbaren Karten umgebaut
- Neuer State `expandedResourceId` (oder Set für mehrere) für die aktuell geöffnete Ressource
- Beim Klick auf eine Karte wird der `content`-Text der Ressource darunter angezeigt
- Optional: Ein "Kopieren"-Button, um den Inhalt in die Zwischenablage zu übernehmen
- Ein ChevronDown/Up-Icon signalisiert, dass die Karte aufklappbar ist

### Ergebnis
- Nutzer können auf Ressourcen-Vorschläge (Gebete, Lesungen, Lieder) klicken
- Der vollständige Text wird inline angezeigt
- Gilt für alle Zeremonien (Hochzeit, Taufe, Konfirmation) gleichermassen

