

# Phase 6: Team, Register & Einstellungen

Phase 6 schliesst den Messeplaner ab. Es geht um drei Bereiche: **Team-Verwaltung**, **Amtshandlungs-Register** und **Gemeinde-Einstellungen**.

---

## 1. Team-Verwaltung (`/dashboard/team`)

Mitarbeitende der Gemeinde verwalten, Rollen zuteilen, Verfügbarkeiten erfassen.

**Funktionen:**
- Liste aller Team-Mitglieder mit Name, Rolle, E-Mail, Status (aktiv/inaktiv)
- Erstellen / Bearbeiten / Löschen von Mitgliedern
- Rollen: Pfarrer, Musiker, Lektor, Sakristei, Techniker, Freiwillige
- Verfügbarkeits-Ansicht (einfache Wochentag-Checkboxen)
- Optional: Mitglied einem Service zuweisen (Verknüpfung Service ↔ Team-Member)

**Datenmodell:** `service_team_members` Tabelle existiert bereits mit allen nötigen Feldern (name, role, email, church_id, availability, is_active).

**UI:** Tabellen-Ansicht mit Dialog zum Hinzufügen/Bearbeiten. Filter nach Rolle.

---

## 2. Amtshandlungs-Register (`/dashboard/records`)

Offizielle kirchliche Handlungen dokumentieren — Taufen, Trauungen, Abdankungen.

**Funktionen:**
- Neuen Eintrag erfassen: Typ (Taufe/Trauung/Abdankung), Datum, beteiligte Personen, Pfarrer, Notizen
- Tabellarische Übersicht mit Suche und Filter nach Typ/Jahr
- PDF-Export einer Einzelhandlung oder Jahresübersicht (Kirchenbuch-Format)
- Verknüpfung mit einem Service (optional)

**DB-Änderung:** Neue Tabelle `church_records`:

```text
church_records
├── id (uuid, PK)
├── church_id (uuid, NOT NULL)
├── created_by (uuid, NOT NULL)
├── record_type (enum: baptism, wedding, funeral)
├── record_date (date, NOT NULL)
├── participants (jsonb) — Namen, Rollen der Beteiligten
├── officiant (text) — Pfarrer/Seelsorger
├── service_id (uuid, nullable) — Verknüpfung zum Gottesdienst
├── notes (text)
├── record_number (text) — offizielle Kirchenbuch-Nummer
├── created_at, updated_at
```

RLS: Nur eigene Einträge (created_by = auth.uid()).

---

## 3. Gemeinde-Einstellungen (`/dashboard/settings`)

Gemeindeprofil pflegen — die Daten aus `church_partners` bearbeitbar machen.

**Funktionen:**
- Gemeindename, Konfession, Stadt, Sprache bearbeiten
- Kontaktdaten (E-Mail, Telefon, Website)
- Logo und Pfarrerbild hochladen (Storage)
- Gottesdienstzeiten, Willkommensnachricht
- Farben (Primary/Secondary) für Branding

**Datenmodell:** `church_partners` hat bereits alle Felder. Kein DB-Change nötig.

**UI:** Formular mit Sektionen (Profil, Kontakt, Branding). Save-Button mit Supabase-Update.

---

## Technische Details

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/TeamPage.tsx` | Komplette CRUD-UI für Team-Mitglieder |
| `src/pages/dashboard/RecordsPage.tsx` | Register-Tabelle + Erfassungs-Dialog |
| `src/pages/dashboard/SettingsPage.tsx` | Formular für Gemeinde-Einstellungen |
| `src/hooks/use-team.ts` | Hook für Team-CRUD |
| `src/hooks/use-records.ts` | Hook für Register-CRUD |
| DB-Migration | Neue Tabelle `church_records` + enum `record_type` |
| `src/i18n/locales/de.json` | Keys für Team, Register, Einstellungen |
| `src/i18n/locales/en.json` | Englische Übersetzungen |

**Reihenfolge:** DB-Migration → Team-Seite → Register-Seite → Einstellungen-Seite

