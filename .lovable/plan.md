

# BibleBot.Life — Roadmap Status Review

## Übersicht: Was ist gebaut, was fehlt

---

## 1. Theologisches RAG-System (plan.md)

| Phase | Status | Details |
|-------|--------|---------|
| **Phase 1: DB-Setup** | ✅ Fertig | `theology_chunks` Tabelle existiert, pgvector aktiv, HNSW-Index |
| **Phase 2: Wissensquellen importieren** | ⚠️ Unklar | Tabelle existiert, aber unklar wie viele Chunks bereits drin sind |
| **Phase 3: Embedding-Pipeline** | ✅ Fertig | `theology-embed` Edge Function existiert |
| **Phase 4: Such-Tool im BibelBot** | ✅ Fertig | `search_theology` Tool ist im `bibelbot-chat` integriert, DB-Funktion `search_theology` existiert |
| **Phase 5: Content-Generierung** | ⚠️ Unklar | Muss geprüft werden, wie viele Einträge generiert wurden |

**Offener Punkt:** Wie viele Chunks sind in `theology_chunks`? (Wörterbuch, Kommentare, Konfessionen, Seelsorge) — das bestimmt, ob Phase 2/5 komplett sind.

---

## 2. Messeplaner (Gottesdienst-Planung)

| Feature | Status | Datei/Tabelle |
|---------|--------|---------------|
| **Dashboard Shell + Routing** | ✅ Fertig | Dashboard mit allen Routes |
| **Service-Editor (Block-DnD)** | ✅ Fertig | `ServiceEditor.tsx`, `services` Tabelle |
| **Kalender-Ansicht** | ✅ Fertig | `ServicesCalendar.tsx` |
| **Vorlagen-System** | ✅ DB ready | `service_templates` Tabelle |
| **Team-Verwaltung** | ✅ Fertig | `TeamPage.tsx`, `service_team_members` Tabelle |
| **Conductor Mode** | ✅ Fertig | `ConductorMode.tsx` |
| **Amtshandlungs-Register** | ✅ Fertig | `RecordsPage.tsx`, `church_records` Tabelle |
| **Rechnungen** | ✅ Fertig | `InvoicesPage.tsx`, `invoices` Tabelle |
| **Ressourcen-Bibliothek** | 🔲 Platzhalter | `ResourceLibrary.tsx` zeigt nur "Kommt in nächster Phase" |
| **Predigtreihen** | 🔲 Platzhalter | `SeriesPage.tsx` zeigt nur "Kommt in nächster Phase" |
| **Teleprompter** | 🔲 Nicht gebaut | Geplant als Read-only Modus |
| **Audio-Player** | 🔲 Nicht gebaut | Geplant für Lieder/Musik |
| **Offline-Fähigkeit (PWA)** | ⚠️ Teilweise | `sw.js` + `manifest.json` existieren, echtes Offline unklar |
| **Gastzugang** | 🔲 Nicht gebaut | Zeitlich begrenzte Links |
| **Statistiken & Feedback** | 🔲 Nicht gebaut | Besucherzahlen etc. |
| **Versionierung** | 🔲 Nicht gebaut | Diff/Rollback |
| **Budget & Kosten** | 🔲 Nicht gebaut | Kostenstellen |
| **Gäste-/Teilnehmerverwaltung** | 🔲 Nicht gebaut | RSVP, Sitzplan |
| **Freiwilligen-Rotation** | 🔲 Nicht gebaut | Auto-Einteilung |

---

## 3. Gemeinde-Partnerschaft

| Feature | Status |
|---------|--------|
| **Patronats-Pakete** | ✅ DB + Seiten fertig |
| **Gemeinde-Branding** | ✅ Fertig (Farben, Logo, Bot-Name) |
| **Splash-Screen** | ✅ Fertig |
| **Gemeinde-Verzeichnis** | ✅ Fertig (`ChurchDirectory`) |
| **Kontaktformular** | ✅ Fertig |
| **Church Wizard** | ✅ Fertig |

---

## 4. Weitere Features (gebaut)

| Feature | Status |
|---------|--------|
| **BibelBot Chat** | ✅ Fertig (mit Tools, RAG, Chat-Historie) |
| **Bibelsuche** | ✅ Fertig (KJV, WEB, Luther, Schlachter) |
| **Bibelquiz** | ✅ Fertig |
| **Tagesimpuls** | ✅ Fertig (inkl. Telegram, E-Mail-Broadcast) |
| **Social-Sharing-Kacheln** | ✅ Gerade gebaut (Canvas, 1080×1080) |
| **Gebetswand** | ✅ Fertig |
| **Abdankungsschreiber** | ✅ Fertig (EulogyWriter) |
| **Outreach/Akquise** | ✅ Fertig (Scrape, Import, Personalisierung, Bulk, E-Mail-Versand) |
| **Analytics** | ✅ Fertig |
| **Auth (E-Mail + Google)** | ✅ Fertig |
| **Admin Dashboard** | ✅ Fertig |
| **i18n (30+ Sprachen)** | ✅ Fertig |
| **Senioren-Modus** | ✅ Fertig |
| **Transaktionale E-Mails** | ✅ Fertig (Custom Templates) |
| **Lebensrad** | ✅ Fertig |

---

## Priorisierte offene Punkte

### Sofort prüfbar
1. **Theology Chunks zählen** — Wie viele Einträge sind in der DB? Sind alle 4 Kategorien abgedeckt?

### Nächste sinnvolle Schritte (nach Priorität)
1. **Ressourcen-Bibliothek** aktivieren (Lieder, Gebete, Lesungen durchsuchbar)
2. **Predigtreihen** aktivieren (Serien verwalten)
3. **Teleprompter/Read-only Modus** im Conductor Mode
4. **Theology-Content auffüllen** falls Chunks noch dünn sind

### Später (v5–v6 Dimensionen)
- Gastzugang, Budget, Rotation, Versionierung, Statistiken, RSVP

