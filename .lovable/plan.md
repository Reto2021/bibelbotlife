

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

#### Login-Flow

```text
Startseite (biblebot.life)
    │
    ├── "Anmelden" Button (bereits vorhanden in Nav-Bar)
    │
    └── /login (bestehende Seite, E-Mail + Google)
              │
              ▼
         Eingeloggt → /dashboard
         │
         Hat User eine Gemeinde? ─ Ja → Dashboard mit Kalender
         │
         Nein → Willkommens-Wizard (Gemeinde erstellen, Tradition wählen)
```

- Eingeloggte User sehen in der Nav-Bar **"Mein Bereich"** statt nur Logout
- Nicht-eingeloggte User sehen den Chat wie bisher — keine Änderung

#### Dashboard-UI

```text
┌─────────────────────────────────────────────────┐
│  BibleBot.Life          🔍  🔔  👤 Pfarrer Müller │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │                                      │
│          │   Nächster Gottesdienst               │
│ 📅 Kalender│   So 12. April — 10:00 Uhr           │
│ ✏️ Neuer  │   "3. Sonntag nach Ostern"           │
│ 📚 Biblio │   [Block-Vorschau]                   │
│ 📊 Serien │                                      │
│ 📋 Register│   Letzte Gottesdienste                │
│ 👥 Team   │   • Karfreitag — Abdankung            │
│ ⚙️ Settings│   • Gründonnerstag — Abendmahl        │
└──────────┴──────────────────────────────────────┘

Mobile: Bottom-Tab-Navigation (5 Tabs)
```

#### Routing

```text
/dashboard            → Übersicht (nächste Services)
/dashboard/services   → Kalender
/dashboard/editor/:id → Block-Editor
/dashboard/resources  → Bibliothek
/dashboard/series     → Predigtreihen
/dashboard/records    → Amtshandlungen
/dashboard/team       → Team & Rotation
/dashboard/settings   → Gemeinde & Tradition
```

Alle `/dashboard/*` Routes sind auth-geschützt via `<ProtectedRoute>`.

---

### 3. Technische Umsetzung

#### Schritt 1: Memory-File schreiben
- `mem://feature/messeplaner` mit vollständigem Plan (Datenmodell, Block-Typen, Phasen, Konfessionen)
- `mem://index.md` aktualisieren

#### Schritt 2: Dateien erstellen (kein DB noch)
- `src/components/ProtectedRoute.tsx` — Auth-Guard
- `src/pages/Dashboard.tsx` — Layout mit Sidebar + Outlet
- `src/pages/dashboard/DashboardHome.tsx` — Übersichtsseite (Platzhalter)
- `src/App.tsx` — Neue Routes einfügen
- `src/pages/Index.tsx` — Nav-Bar: "Mein Bereich" für eingeloggte User

#### Neue Dateien

```text
src/components/ProtectedRoute.tsx
src/pages/Dashboard.tsx
src/pages/dashboard/DashboardHome.tsx
```

---

### 4. Phasenplan

| Phase | Inhalt |
|-------|--------|
| **1 (jetzt)** | Memory-File, Dashboard-Shell, ProtectedRoute, Nav-Anpassung |
| **2** | DB-Migration (services, templates, resource_library, series, team) |
| **3** | Service-Editor mit Block-DnD + BibleBot-Button |
| **4** | Kalender, Vorlagen, Print-CSS |
| **5** | Conductor Mode, Teleprompter, Audio |
| **6** | Team, Rotation, Register, Offline, Statistiken |

