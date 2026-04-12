

## Problem
Die `getChurchContext()`-Funktion in `daily-impulse/index.ts` berechnet Ostern nicht dynamisch. Stattdessen gibt sie für den gesamten März und April pauschal "mögliche Fastenzeit oder Osterzeit" zurück. Das ist falsch — Ostern 2026 war am 5. April, der 12. April ist bereits die 2. Woche nach Ostern.

## Lösung
Die Oster-Berechnung dynamisch machen mit dem Gauss'schen Algorithmus (Computus), und daraus alle beweglichen Feiertage ableiten.

## Technische Umsetzung

**Datei:** `supabase/functions/daily-impulse/index.ts`

**1. Neue Funktion `computeEaster(year)`** — Berechnet Ostersonntag für ein beliebiges Jahr (Anonymous Gregorian algorithm).

**2. `getChurchContext()` komplett überarbeiten** — Bewegliche Feiertage relativ zu Ostern berechnen:

| Tage relativ zu Ostern | Feiertag |
|---|---|
| -46 | Aschermittwoch (Beginn Fastenzeit) |
| -7 | Palmsonntag |
| -3 bis -1 | Karfreitag, Karsamstag |
| 0 | Ostersonntag |
| +1 | Ostermontag |
| +39 | Auffahrt / Christi Himmelfahrt |
| +49 | Pfingstsonntag |
| +50 | Pfingstmontag |
| +60 | Fronleichnam |

**3. Logik:** Heutiges Datum wird als Differenz zu Ostern berechnet → passender Kontext wird zurückgegeben. Feste Feiertage (Weihnachten etc.) bleiben wie bisher.

**4. Die vage Zeile `if (month >= 3 && month <= 4)` wird entfernt** und durch präzise Bereiche ersetzt:
- Fastenzeit: Aschermittwoch bis Palmsonntag
- Karwoche: Palmsonntag bis Karsamstag  
- Ostern: Ostersonntag + Ostermontag
- Osterzeit: Ostermontag+1 bis Auffahrt-1
- usw.

Eine Datei, ca. 40 Zeilen neuer Code, Rest bleibt gleich. Edge Function wird danach deployed.

