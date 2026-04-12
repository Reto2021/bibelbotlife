

## Problem

Die KI stellt am Ende der Antwort eine spannende Reflexionsfrage im Fliesstext (z.B. "Was denkst du, warum wir lieber an unseren Sorgen festhalten?"), aber die darauf folgenden Optionen (a/b/c Buttons) sind unabhängige Gesprächs-Weiterleitungen, die nicht auf diese Frage eingehen. Das verwirrt den Nutzer — er erwartet, dass die Buttons Antworten oder Vertiefungen der gestellten Frage sind.

## Ursache

Im System-Prompt (`supabase/functions/bibelbot-chat/index.ts`, Zeile 568-600) gibt es zwei widersprüchliche Anweisungen:
1. "Stelle pro Antwort 1-2 gezielte Fragen" (Zeile 569)
2. "Beende JEDE Antwort mit mindestens 2 Optionen a), b), c)" (Zeile 598)

Die KI macht beides: eine offene Frage im Text + separate Optionen danach. Da die Optionen nach der Frage kommen, wirken sie wie Antwortmöglichkeiten — sind es aber nicht.

## Lösung

Den System-Prompt anpassen, damit Frage und Optionen **eine Einheit** bilden:

**Neue Regel im Prompt (ersetzt Zeile 568-600):**

> Wenn du eine Reflexionsfrage stellst, müssen die Optionen (a/b/c) als mögliche Antworten oder Vertiefungen **dieser Frage** dienen. Die Frage bildet die Überleitung zu den Optionen.
>
> **Beispiel RICHTIG:**
> Was denkst du — warum halten wir manchmal lieber an unseren Sorgen fest?
>
> a) Vielleicht weil Sorgen uns ein Gefühl von Kontrolle geben
> b) Ich glaube, es fällt mir schwer loszulassen, weil ich Angst habe
> c) Lass uns anschauen, was die Bibel dazu sagt
>
> **Beispiel FALSCH:**
> Was denkst du — warum halten wir manchmal lieber an unseren Sorgen fest?
>
> a) Lass uns über Dankbarkeit sprechen
> b) Möchtest du einen Psalm dazu hören?
> c) Erzähl mir mehr über dein Anliegen

Ausserdem: eine Option soll immer eine "freie Antwort"-Einladung sein (z.B. "Ich möchte frei darauf antworten"), damit der Nutzer nicht in ein Multiple-Choice-Schema gezwungen wird.

## Technische Umsetzung

**1 Datei:** `supabase/functions/bibelbot-chat/index.ts`

- Zeile 568-600: Die Abschnitte "Wichtig" und "PFLICHT: Immer Optionen anbieten" zusammenführen und neu formulieren
- Kernregel: "Deine Reflexionsfrage AM ENDE der Antwort ist gleichzeitig die Einleitung zu den Optionen. Die Optionen sind mögliche Reaktionen auf diese Frage."
- Zusatz: "Eine der Optionen soll immer eine offene Einladung sein, frei zu antworten"

**Deployment:** Edge Function wird nach Änderung automatisch deployed.

