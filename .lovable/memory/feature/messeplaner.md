---
name: Messeplaner v6
description: Vollständiger Gottesdienst-Planungs-Modul mit 10 Dimensionen, Block-Editor, Conductor Mode
type: feature
---

# Messeplaner v6 — Vollständiger Plan

## Zugang

- Login via `/login` (E-Mail + Google, bestehend)
- Eingeloggte User → `/dashboard`
- Nav-Bar zeigt "Mein Bereich" für eingeloggte User
- Alle `/dashboard/*` Routes auth-geschützt via `<ProtectedRoute>`

## Routing

```
/dashboard            → Übersicht (nächste Services)
/dashboard/services   → Kalender
/dashboard/editor/:id → Block-Editor
/dashboard/resources  → Bibliothek
/dashboard/series     → Predigtreihen
/dashboard/records    → Amtshandlungen
/dashboard/team       → Team & Rotation
/dashboard/settings   → Gemeinde & Tradition
```

## Kernfunktionen (v1–v4)

1. **Service-Editor** — Drag & Drop Blöcke (Lied, Lesung, Predigt, Gebet, Segen, Abendmahl, Liturgie, Freier Block)
2. **Kalender-Ansicht** — Monats-/Wochen-/Tagesansicht + Print-CSS
3. **BibleBot-Integration** — "BibleBot fragen"-Button pro Block (Bibelstelle, Liedvorschlag, Gebetsimpuls)
4. **Team-Verwaltung** — Rollen: Pfarrer, Musiker, Lektor, Sakristei, Techniker
5. **Vorlagen-System** — Konfessions-Profile (Katholisch, Reformiert, Lutherisch, Evangelikal, Säkular)
6. **Ressourcen-Bibliothek** — Lieder, Gebete, Lesungen, durchsuchbar und taggbar
7. **Conductor Mode** — Live-Durchführung, distraction-free, swipeable Blöcke
8. **Teleprompter** — Read-only Modus, grosse Schrift, Auto-Scroll
9. **Audio-Player** — Integrierter Player für Lieder/Musik
10. **Besuchsprotokolle** — KI-Zusammenfassung von Seelsorge-Gesprächen

## 10 ergänzte Dimensionen (v5–v6)

1. **Mehrsprachigkeit pro Block** — Jeder Block kann mehrere Sprachen haben (z.B. Lied DE + EN)
2. **Amtshandlungs-Register** — Taufe, Trauung, Abdankung mit offiziellem Kirchenbuch-Export
3. **Gäste-/Teilnehmerverwaltung** — Einladungen, RSVP, Sitzplan für Kasualien
4. **Budget & Kosten** — Kostenstellen pro Gottesdienst (Blumen, Musiker, Drucksachen)
5. **Freiwilligen-Rotation** — Automatische Einteilung mit Verfügbarkeits-Kalender
6. **Offline-Fähigkeit (PWA)** — IndexedDB-Cache, Background Sync
7. **Gastzugang** — Zeitlich begrenzte Links für externe Mitwirkende (Musiker, Prediger)
8. **Statistiken & Feedback** — Besucherzahlen, Gemeinde-Feedback nach Gottesdienst
9. **Barrierefreiheit** — WCAG 2.1 AA, Screenreader, Tastatur-Navigation, Senioren-Modus
10. **Versionierung** — Änderungshistorie pro Gottesdienst, Diff-Ansicht, Rollback

## Konfessionen

| Konfession | Liturgie-Blöcke | Besonderheiten |
|------------|----------------|----------------|
| Katholisch | Introitus, Kyrie, Gloria, Lesung, Evangelium, Predigt, Credo, Fürbitten, Gabenbereitung, Sanctus, Hochgebet, Vaterunser, Agnus Dei, Kommunion, Segen | Kirchenjahr-Kalender, Messformulare |
| Reformiert | Eingang, Gebet, Lesung, Predigt, Gebet, Lied, Segen | Freiere Struktur, Predigtfokus |
| Lutherisch | Ähnlich katholisch, aber mit Varianten | Choräle, Perikopenordnung |
| Evangelikal/Freikirchlich | Worship, Predigt, Gebet, Altar Call | Worship-Sets, freie Form |
| Säkular/Frei | Komplett frei konfigurierbar | Keine liturgischen Vorgaben |

## Block-Typen

```
song          — Lied (mit Strophen, Tonart, Tempo)
reading       — Bibellesung (Buch, Kapitel, Verse, Übersetzung)
sermon        — Predigt (Titel, Notizen, Dauer)
prayer        — Gebet (Typ: Fürbitte, Dank, Bekenntnis)
blessing      — Segen
communion     — Abendmahl/Eucharistie
liturgy       — Liturgischer Text (Kyrie, Gloria, Credo etc.)
announcement  — Bekanntmachung
free          — Freier Block
music         — Instrumentalmusik / Audio
```

## Datenmodell (geplant)

### services
- id, church_id, title, date, time, type (Sonntagsgottesdienst, Kasualien, etc.)
- tradition (enum), status (draft/published/archived)
- blocks (jsonb — geordnete Block-Liste)
- notes, created_by, created_at, updated_at

### service_templates
- id, church_id, name, tradition, blocks (jsonb)

### resource_library
- id, church_id, type (song/prayer/reading), title, content, tags, language

### service_series
- id, church_id, name, description, start_date, end_date

### service_team_members
- id, church_id, user_id, name, role, availability (jsonb)

## Phasenplan

| Phase | Inhalt |
|-------|--------|
| 1 | Memory-File, Dashboard-Shell, ProtectedRoute, Nav-Anpassung |
| 2 | DB-Migration (services, templates, resource_library, series, team) |
| 3 | Service-Editor mit Block-DnD + BibleBot-Button |
| 4 | Kalender, Vorlagen, Print-CSS |
| 5 | Conductor Mode, Teleprompter, Audio |
| 6 | Team, Rotation, Register, Offline, Statistiken |

## UI

- Desktop: Sidebar-Layout (SidebarProvider + Sidebar)
- Mobile: Bottom-Tab-Navigation (5 Tabs: Home, Kalender, Neu, Bibliothek, Team)
- Conductor Mode: Fullscreen, swipeable, grosse Schrift
