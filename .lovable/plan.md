

## Analysis

**Zur Frage "Sind die Zitate geprüft?":**
- Im **verse_guess**-Modus: Die Verse kommen direkt aus der `bible_verses`-Tabelle — diese sind korrekt (echte Bibelverse aus importierten Übersetzungen).
- Im **multiple_choice**-Modus: Die KI generiert Fragen *basierend* auf einem echten Vers. Die Frage selbst ist KI-generiert, aber die Referenz (`reference`) und der Verstext (`verse_text`) stammen aus der DB und sind korrekt.

Also: Die Bibelstellen-Referenzen sind verifiziert, die MC-Fragen sind KI-generiert (könnten theoretisch ungenau sein).

## Plan: "Chat öffnen" Button unter dem Quiz-Ergebnis

Nach der Beantwortung einer Frage wird unter dem Ergebnis-Bereich ein Button hinzugefügt, der den BibelBot-Chat mit einer vorformulierten Nachricht öffnet.

### Änderungen

**1. `src/pages/BibleQuiz.tsx`**
- Import `openBibleBotChat` aus `@/lib/chat-events`
- Import `MessageCircle` Icon von lucide-react
- Im `showResult`-Block (nach der Referenz-Anzeige, ca. Zeile 446): Neuen Button einfügen
- Der Button ruft `openBibleBotChat()` auf mit einer Nachricht wie:
  `"Erkläre mir diesen Bibelvers: {reference} — „{verse_text}""` 
- Falls kein `verse_text` vorhanden (MC-Modus), wird nur die Referenz verwendet
- Button-Text: "Über diesen Vers sprechen" mit Chat-Icon

### Ergebnis
- Jede beantwortete Quizfrage hat einen direkten Link zum Chat
- Der Chat öffnet sich mit Kontext zur Bibelstelle
- Nutzer können die Stelle vertiefen, ohne manuell suchen zu müssen

