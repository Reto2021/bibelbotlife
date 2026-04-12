

## Adaptive Antwortlänge für maximale Interaktionsrate

### Forschung & Best Practices

Aus der Chatbot-UX-Forschung und Praxisdaten:

- **Optimal für Engagement: 80–150 Wörter** pro Nachricht in konversationellen Chats (Intercom, Drift, ChatGPT-Studien). Ab ~200 Wörtern sinkt die Reply-Rate um 30-50%.
- **Erste Nachricht kürzer** (~80-120 Wörter): Der User muss "reinkommen". Lange Erstantworten schrecken ab.
- **Vertiefung länger** (150-250 Wörter): Wenn der User bereits 3+ Nachrichten geschrieben hat, akzeptiert er mehr Tiefe.
- **Schnelle Antworten** (unter 50 Wörter): Gut für Rückfragen, schlecht für inhaltliche Antworten — zu dünn.
- **Mobile-Faktor**: Auf kleinen Screens (< 500px) wirken 200 Wörter wie eine Textwand. Ideal: max. 2-3 Bildschirmhöhen.

### Aktueller Stand

Zeile 702: `Halte Antworten fokussiert (ca. 200-400 Wörter)` — statisch, zu lang für den Gesprächseinstieg.

### Lösung: Adaptives Längensystem

**Signale, die der Edge Function bereits zur Verfügung stehen:**
- `messages.length` — Gesprächstiefe (wie viele Nachrichten wurden gewechselt?)
- `messages[messages.length-1].content.length` — Länge der letzten User-Nachricht (kurze Frage → kurze Antwort)
- `mode` — bereits vorhanden (könnte erweitert werden)

**Neuer Client-seitiger Signal: `screenWidth`** — wird bereits im Analytics getrackt, muss nur an den Chat übergeben werden.

### Adaptive Regeln im System-Prompt

```text
## Antwortlänge (ADAPTIV)
Passe deine Antwortlänge an die Gesprächssituation an:

ERSTE ANTWORT (1-2 Nachrichten im Gespräch):
→ 80-120 Wörter. Kurz, einladend, eine Frage. Der User soll antworten wollen, nicht lesen müssen.

AUFWÄRMPHASE (3-6 Nachrichten):
→ 120-180 Wörter. Mehr Tiefe, eine Bibelstelle, eine Reflexionsfrage.

VERTIEFUNGSPHASE (7+ Nachrichten):
→ 150-250 Wörter. Der User ist engagiert. Hier darfst du ausführlicher werden.

KURZE USER-NACHRICHT (unter 20 Zeichen, z.B. "a", "ja", "mehr"):
→ Antworte kompakt (60-100 Wörter). Der User will schnell weiter.

LANGE USER-NACHRICHT (über 200 Zeichen):
→ Der User teilt viel. Antworte angemessen ausführlich (150-250 Wörter), aber strukturiert.

MOBILE (screenWidth < 500):
→ Reduziere das obere Limit um 30%. Max. 2 kurze Absätze vor den Optionen.

GRUNDREGEL: Lieber zu kurz als zu lang. Eine gute Frage am Ende ist wertvoller als ein langer Absatz.
```

### Technische Umsetzung

**2 Dateien:**

1. **`src/components/BibelBotChat.tsx`** — `screenWidth: window.innerWidth` zum Request-Body hinzufügen (1 Zeile)

2. **`supabase/functions/bibelbot-chat/index.ts`**:
   - `screenWidth` aus dem Request-Body auslesen
   - Gesprächstiefe (`messages.length`) und letzte User-Nachricht-Länge berechnen
   - Dynamischen Längenparagraph im System-Prompt einfügen basierend auf diesen Signalen
   - Zeile 702 (`ca. 200-400 Wörter`) durch die adaptive Anweisung ersetzen
   - Edge Function deployen

### Kein Tracking nötig

Alles wird pro Request berechnet — kein neues DB-Schema, kein localStorage, keine zusätzliche Komplexität.

