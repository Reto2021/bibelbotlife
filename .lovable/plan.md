
Ziel: Ich räume jetzt nicht nur den Publisher-Blocker auf, sondern den Security-/Linter-Status komplett sauber auf.

Was ich bereits eingegrenzt habe:
- Publish-Sichtbarkeit ist bereits öffentlich. Das Problem ist also nicht die Sichtbarkeit der veröffentlichten Seite.
- Die Gebetswand ist schon auf moderiert öffentlich umgestellt.
- Im Code sehe ich noch mehrere Stellen, die typischerweise weitere Backend-Warnungen auslösen können, obwohl die App funktional läuft.

Umsetzungsplan

1. Exakte Warnungsliste live auslesen
- Aktuellen Security-Scan und Datenbank-Linter erneut laufen lassen.
- Jede verbleibende Warnung einer konkreten Ursache zuordnen, statt blind weiterzupatchen.
- Danach nur noch zwei Kategorien behalten:
  - echte Probleme, die ich behebe
  - bewusst öffentliche Fälle, die ich sauber als beabsichtigt dokumentiere

2. Öffentliche Datenzugriffe minimieren
Ich härte die öffentlichen Lesewege nach dem Prinzip „nur wirklich benötigte Felder“:
- `church_partners_public` verschlanken, damit nur die Felder öffentlich bleiben, die in Verzeichnis, Partnerseite, Splash, Branding und Integration wirklich gebraucht werden
- unnötige öffentliche Felder wie interne Metadaten entfernen
- alle betroffenen Frontend-Abfragen darauf anpassen

3. Quiz-Leaderboard sauber trennen
Aktuell liest das Quiz direkt aus `quiz_scores`, obwohl dort rohe Session-Daten liegen.
Ich würde:
- öffentliche Roh-SELECTs auf der Basistabelle entfernen oder stark einschränken
- einen sicheren öffentlichen Leaderboard-Zugriff über View oder RPC bereitstellen
- die Quiz-Seite auf diesen sicheren Zugriff umstellen

4. Geteilte Entwürfe härten
`get_shared_draft` gibt derzeit effektiv einen ganzen Draft zurück.
Ich würde:
- die Funktion auf genau die Felder reduzieren, die die öffentliche Shared-Seite wirklich braucht
- keine unnötigen internen Felder mehr öffentlich zurückgeben
- den Shared-Draft-Hook und die Typen darauf abstimmen

5. PrayerWall-Folgewarnungen bereinigen
Ich prüfe die moderierte Gebetswand nochmals auf Restwarnungen:
- `get_public_prayers` nur sichere Felder
- `increment_prayer_count` nur für freigegebene Einträge
- Policies und Funktionen so abstimmen, dass öffentlich nur das Minimum möglich ist

6. Absichtlich öffentliche Tabellen/Funktionen sauber behandeln
Einige Dinge sind fachlich bewusst öffentlich, z.B.:
- Kontaktformular an Gemeinden
- Tagesimpuls-/Abo-Flows
- Bibelverse / öffentliche Inhalte
Wenn diese nach der Härtung weiterhin als Warnung erscheinen, markiere ich sie nur dann als „bewusst öffentlich“, wenn wirklich keine sensitiven Daten offenliegen.

7. Frontend nachziehen
Ich passe danach alle betroffenen Stellen an, damit nichts bricht:
- `ChurchDirectory.tsx`
- `ChurchPartner.tsx`
- `ChurchIntegration.tsx`
- `ChurchBanner.tsx`
- `SplashScreen.tsx`
- `use-church-branding.ts`
- `BibleQuiz.tsx`
- `use-ceremony-drafts.ts`
- ggf. generierte Typen nach den Datenbankänderungen

8. Abschlussprüfung und Publish-Freigabe
- Security-Scan erneut ausführen
- Datenbank-Linter erneut ausführen
- prüfen, dass keine offenen relevanten Warnungen mehr übrig sind
- danach Publish erneut testen
- falls der Button trotz sauberem Status noch grau bleibt, ist es sehr wahrscheinlich ein UI-/Cache-Zustand im Review-Security-Dialog; dann räume ich als letzten Schritt gezielt diesen Restzustand auf

Technische Details
- Vermutlich nötig: neue Migrationen für Policies, Views und RPCs
- Keine Änderungen an `src/integrations/supabase/client.ts`
- Öffentliche Features bleiben möglich, aber nur noch über abgesicherte Views/Funktionen mit minimalem Datenumfang
- Ich würde zusätzlich die zwei React-Ref-Warnungen (`AppLogo`, `DailyImpulse`) separat bereinigen, weil sie zwar nicht der Security-Blocker sind, aber unnötigen Larm erzeugen

Erwartetes Ergebnis
- sauberer Security-/Linter-Status
- keine unnötig offenen öffentlichen Datenpfade mehr
- Publish sollte wieder freigegeben werden
- falls Lovable den alten Security-Zustand cached, kann ich nach dem Cleanup gezielt den finalen Recheck begleiten
