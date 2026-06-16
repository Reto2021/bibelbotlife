## Widget-Nutzungslimit für Senfkorn-Paket (gratis)

**Logik:** 1 Frage gratis pro End-User (Fingerprint via localStorage), danach sanfter Hinweis im Chat, aber weiterhin nutzbar. Counts werden getrackt und im Admin sichtbar — als Verkaufsargument fürs Upgrade-Gespräch.

### 1. End-User-Identifikation

Im Widget (bzw. Chat mit `?church=slug`-Parameter) wird beim ersten Aufruf eine `widget_visitor_id` (UUID) in `localStorage` gespeichert. Diese ID wandert bei jedem Chat-Request mit.

```text
localStorage key: "bb_visitor_id"
value: UUID (einmalig generiert)
```

Datenschutz-Hinweis: keine personenbezogenen Daten, nur zufällige Kennung. In der Datenschutzerklärung des Widgets erwähnen.

### 2. Tracking-Tabelle

Neue Tabelle `widget_usage`:

```text
widget_usage
- id (uuid)
- church_id → church_partners
- visitor_id (text, der Fingerprint aus localStorage)
- question_count (int, default 0)
- first_seen_at, last_seen_at
- unique (church_id, visitor_id)
```

RLS:
- service_role: voll (Edge Function schreibt)
- Church-Owner & Team: SELECT auf eigene Gemeinde (für Admin-Anzeige)
- Admin: SELECT alle

### 3. Edge Function: Counter & Soft-Limit

In `bible-search` / Chat-Edge-Function (dort wo die Frage entgegengenommen wird) wird:

1. Wenn Request mit `church=slug` und `visitor_id` ankommt → Gemeinde lookup.
2. Bei `plan_tier = 'free'` (Senfkorn):
   - `widget_usage` row upsert + `question_count + 1`.
   - Wenn `question_count > 1`: Flag `limit_exceeded: true` in der Response anhängen.
3. Antwort wird **immer** generiert (sanfter Hinweis, kein Hard-Stop).
4. Frontend zeigt nach jeder Antwort über dem Eingabefeld einen dezenten Hinweis:

```text
Wenn limit_exceeded:
  „Diese Gemeinde nutzt das Senfkorn-Paket (gratis).
   Bei Interesse an mehr Funktionen → biblebot.life/gemeinden"
```

Bei kostenpflichtigen Tiers (Community/Gemeinde/Leuchtturm) → kein Limit, kein Hinweis.

### 4. Anzeige im Admin- und Gemeinde-Dashboard

**Im ChurchDetailDrawer (Admin):** Neuer Tab oder Sektion „Widget-Nutzung":
- Unique Visitors (Gesamt + letzte 30 Tage)
- Fragen gesamt
- Anteil „Wiederkehrer" (> 1 Frage) → Upgrade-Indikator
- Top-Tage / Chart

**Im Gemeinde-Bereich (Mein Bereich → Statistik):** gleiche Übersicht für die eigene Gemeinde — als Wert-Demonstration.

### 5. Optional, später

- Counter-Reset monatlich (per Cron) falls man später auf „1 Frage pro Monat" wechseln will
- A/B-Test: Email-Wall vs. sanfter Hinweis (Conversion-Vergleich)
- Pro Tier konfigurierbares Limit in `church_partners.plan_config` (jsonb), damit man ohne Code-Change anpassen kann

### Reihenfolge

1. Migration: `widget_usage` Tabelle + RLS
2. Edge Function: Counter-Logik + `limit_exceeded` Flag in Response
3. Widget/Chat-Frontend: Visitor-ID Setup + Soft-Hinweis-UI
4. Admin: Widget-Nutzungs-Sektion in ChurchDetailDrawer
5. Gemeinde-Dashboard: eigene Statistik
