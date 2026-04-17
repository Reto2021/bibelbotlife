

## Ressourcen-Karten aufklappbar machen + Chat-Weiterführung

### Problem
Die Ressourcen-Karten in der Bibliothek zeigen nur einen 2-Zeilen-Vorschau (`line-clamp-2`). Man kann den vollen Inhalt nicht lesen und Bibelstellen sind nicht klickbar. Es fehlt eine Möglichkeit, direkt in den Chat zu wechseln.

### Lösung

**1. Expand/Collapse pro Karte** (`ResourceLibrary.tsx`)
- Neuer State: `expandedIds: Set<string>` — mehrere Karten gleichzeitig aufklappbar
- Klick auf die Karte (oder einen Chevron-Button) toggled die ID im Set
- Im zugeklappten Zustand: `line-clamp-2` (wie bisher)
- Im aufgeklappten Zustand: voller `content`-Text mit `whitespace-pre-wrap`, kein line-clamp
- ChevronDown/ChevronUp-Icon als visueller Hinweis

**2. "Im Chat vertiefen"-Button**
- Nur im aufgeklappten Zustand sichtbar
- Ruft `openBibleBotChat()` auf mit dem Ressourcen-Titel als Kontext
- z.B. `"Erkläre mir diese Bibelstelle: {title}"` für Lesungen, oder `"Erzähle mir mehr über dieses Gebet: {title}"` für Gebete
- MessageCircle-Icon + "Im Chat vertiefen"

**3. Kopieren-Button**
- Ebenfalls nur im aufgeklappten Zustand
- Kopiert den `content`-Text in die Zwischenablage

### Dateien
- `src/pages/dashboard/ResourceLibrary.tsx` — Expand-State, Karten-Klick, aufgeklappte Ansicht mit Chat- und Kopier-Button

