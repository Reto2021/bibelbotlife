
## Messeplaner v6 — Memory-File + Zugangskonzept

### 1. Memory-File erstellen

Speichere den vollständigen Messeplaner-Plan v6 unter `mem://feature/messeplaner` mit allen Dimensionen:

**Kernfunktionen (v1–v4)**:
- Service-Editor mit Drag & Drop Blöcken
- Kalender-Ansicht & Print-CSS
- BibleBot-Integration pro Block ("BibleBot fragen")
- Team-Verwaltung (Rollen: Pfarrer, Musiker, Lektor, Sakristei)
- Vorlagen-System mit Konfessions-Profilen
- Ressourcen-Bibliothek (Lieder, Gebete, Lesungen)
- Conductor Mode (Live-Durchführung)
- Teleprompter (Read-Modus)
- Integrierter Audio-Player
- Besuchsprotokolle mit KI-Zusammenfassung

**10 ergänzte Dimensionen (v5–v6)**:
1. Mehrsprachigkeit pro Block
2. Amtshandlungs-Register (Taufe, Trauung, Abdankung)
3. Gäste-/Teilnehmerverwaltung
4. Budget & Kosten
5. Freiwilligen-Rotation
6. Offline-Fähigkeit (PWA)
7. Gastzugang für externe Mitwirkende
8. Statistiken & Feedback
9. Barrierefreiheit
10. Versionierung & Änderungshistorie

**Konfessionen**: Katholisch, Reformiert, Lutherisch, Evangelikal/Freikirchlich, Säkular/Freie Zeremonien

---

### 2. Zugang: Wie gelangen Seelsorger zum Messe-Modul?

#### Navigation & Routing

```
/login                → Bestehende Login-Seite (E-Mail + Google)
/dashboard            → NEU: Seelsorger-Dashboard (nach Login)
/dashboard/services   → Service-Kalender & Editor
/dashboard/resources  → Ressourcen-Bibliothek
/dashboard/series     → Predigtreihen
/dashboard/records    → Amtshandlungen
/dashboard/team       → Team-Verwaltung
```

#### Login-Flow

```text
Startseite (biblebot.life)
    │
    ├── "Anmelden" Button (bereits vorhanden, Nav-Bar)
    │
    └── /login (bestehende Seite)
         ├── Google Login
         └── E-Mail + Passwort
              │
              ▼
         Hat User eine Gemeinde? ──── Ja ──→ /dashboard
              │
              Nein
              │
              ▼
         /dashboard (Willkommens-Wizard)
         "Gemeinde einrichten" → Tradition wählen → Fertig
```

- Eingeloggte User sehen in der Nav-Bar einen neuen **"Mein Bereich"**-Button (statt nur Logout)
- Klick → `/dashboard` mit Sidebar-Navigation
- Nicht-eingeloggte User sehen den Button nicht — die öffentliche Chat-Seite bleibt unverändert

#### Dashboard-UI (Wireframe)

```text
┌─────────────────────────────────────────────────┐
│  BibleBot.Life          🔍  🔔  👤 Pfarrer Müller │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │                                      │
│          │   Nächster Gottesdienst               │
│ 📅 Kalender│   So 12. April — 10:00 Uhr           │
│ ✏️ Neuer  │   "3. Sonntag nach Ostern"           │
│ 📚 Biblio │   ┌─────────────────────────┐        │
│ 📊 Serien │   │ Einzug  │ Begrüssung   │        │
│ 📋 Register│   │ Lied GL │ Lesung       │        │
│ 👥 Team   │   │ Predigt │ Fürbitten    │        │
│ ⚙️ Settings│   │ Segen   │              │        │
│          │   └─────────────────────────┘        │
│          │                                      │
│          │   Letzte Gottesdienste                │
│          │   • Karfreitag — Abdankung            │
│          │   • Gründonnerstag — Abendmahl        │
└──────────┴──────────────────────────────────────┘
```

- **Mobile**: Sidebar wird zu Bottom-Tab-Navigation (5 Tabs: Kalender, Neu, Bibliothek, Register, Profil)
- **Conductor Mode**: Vollbild ohne Sidebar, nur Block-Ansicht + Swipe

---

### 3. Technische Umsetzung

#### Neue Dateien

```text
src/pages/Dashboard.tsx              — Dashboard-Layout mit Sidebar
src/pages/dashboard/
  ServiceCalendar.tsx                — Kalender-Übersicht
  ServiceEditor.tsx                  — Block-Editor mit DnD
  ResourceLibrary.tsx                — Baustein-Bibliothek
  ServiceSeries.tsx                  — Predigtreihen
  ChurchRecords.tsx                  — Amtshandlungen
  TeamManager.tsx                    — Team & Rotation
  Settings.tsx                       — Gemeinde-Einstellungen & Tradition
src/components/services/
  ServiceBlock.tsx                   — Einzelner Block im Editor
  BlockPalette.tsx                   — Block-Typen zum Einfügen
  ConductorMode.tsx                  — Live-Durchführung
  TeleprompterView.tsx               — Predigt-Lesemodus
  AudioPlayer.tsx                    — Inline-Musik-Player
```

#### Datenbank (Migration)

5 neue Tabellen:
- `services` — Gottesdienste mit Blöcken (JSONB)
- `service_templates` — Vorlagen pro Tradition
- `service_team_members` — Team-Zuordnung
- `resource_library` — Wiederverwendbare Bausteine
- `service_series` — Predigtreihen

Plus `church_records` für Amtshandlungen (Phase 2).

Alle Tabellen mit RLS: User sehen nur Daten ihrer eigenen Gemeinde.

#### Routing in App.tsx

```text
Neue Routes (alle lazy-loaded, auth-geschützt):
  /dashboard/*  →  Dashboard-Layout mit verschachtelten Routes
```

Ein `<ProtectedRoute>` Wrapper prüft `useAuth()` und leitet zu `/login` um falls nicht eingeloggt.

---

### 4. Phasenplan

| Phase | Was | Umfang |
|-------|-----|--------|
| **1** | DB-Migration, Dashboard-Layout, Service-Editor (Blöcke, DnD), Kalender | Kern |
| **2** | BibleBot pro Block, Ressourcen-Bibliothek, Vorlagen, Print-CSS | KI + Inhalte |
| **3** | Conductor Mode, Teleprompter, Audio-Player | Durchführung |
| **4** | Team, Rotation, Serien, Amtshandlungen, Offline (PWA) | Organisation |
| **5** | Statistiken, Versionierung, Gastzugang, Barrierefreiheit | Reife |
