
# Phase 7: Super-Admin Panel

Geschütztes Verwaltungs-Panel für BibleBot.Life-Betreiber unter `/admin`.

---

## 1. DB-Migration: Rollen-System

**Neue Tabelle `user_roles`** (Rollen separat von Profilen – Best Practice gegen Privilege Escalation):

```text
user_roles
├── id (uuid, PK)
├── user_id (uuid, NOT NULL, FK → auth.users, ON DELETE CASCADE)
├── role (enum app_role: admin, moderator, user)
├── UNIQUE(user_id, role)
```

**Security-Definer-Funktion** `has_role(user_id, role)` – prüft Rollen ohne RLS-Rekursion.

**RLS auf `user_roles`:** Nur lesbar für den eigenen User. Kein Insert/Update/Delete via Client.

**Neue RLS auf `church_partners`:** Admins können ALLE Gemeinden lesen (auch inaktive) und bearbeiten.

**Neue RLS auf relevanten Tabellen:** Admins können `daily_subscribers`, `analytics_events`, `church_contact_requests` etc. lesen.

---

## 2. Admin-Dashboard (`/admin`)

**Stats-Kacheln** (oben, 4-5 Karten):
- Gemeinden gesamt
- Aktive Abos (subscription_status = 'active')
- Ablaufende Abos (nächste 30 Tage)
- Tagesimpuls-Abonnenten (daily_subscribers, is_active)
- Chat-Nachrichten heute

**Gemeinden-Tabelle** (darunter):
- Spalten: Name, Stadt, Plan-Tier, Abo-Status, Abo-Ablauf, Erstellt
- Suche nach Name/Stadt
- Filter nach Plan-Tier und Abo-Status
- Sortierung nach Name, Erstellt, Ablauf
- Klick öffnet Detail-Drawer

---

## 3. Gemeinde-Detail-Drawer (Sheet)

Klick auf eine Gemeinde öffnet rechts einen Drawer mit **3 Tabs**:

**Tab „Profil":**
- Name, Slug, Konfession, Stadt, Land, Sprache
- Kontaktperson, E-Mail, Telefon, Website
- Logo-Vorschau (falls vorhanden)
- Pastor-Name und -Foto

**Tab „Abo & Billing":**
- Plan-Tier ändern (Dropdown: free/community/gemeinde/kirche)
- Abo-Status ändern (trial/active/expired/cancelled)
- Abo-Start / Abo-Ablauf (Datum-Picker)
- Rechnungsname, Strasse, PLZ, Stadt, Land
- Billing-E-Mail, IBAN, Referenz
- Billing-Intervall (monatlich/jährlich)

**Tab „Nutzung":**
- Anzahl Services
- Anzahl Team-Mitglieder
- Anzahl Kirchenbuch-Einträge
- Letzte Aktivität (updated_at)

**Aktionen im Drawer:**
- Speichern (alle Änderungen)
- Gemeinde aktivieren/deaktivieren (Toggle)

---

## 4. Route-Schutz

- `ProtectedAdminRoute` Wrapper prüft Rolle via `supabase.rpc('has_role', ...)` (kein localStorage!)
- Loading-State während Rollen-Check
- Nicht-Admins → Redirect auf `/`
- Admin-Link im Header nur für Admins sichtbar

---

## 5. Dateien & Reihenfolge

| # | Datei | Beschreibung |
|---|---|---|
| 1 | DB-Migration | `user_roles`, `app_role` enum, `has_role()`, RLS-Policies |
| 2 | `src/hooks/use-admin.ts` | Hook: Rollen-Check, Stats laden, Gemeinden-Liste |
| 3 | `src/components/ProtectedAdminRoute.tsx` | Route-Guard via RPC |
| 4 | `src/pages/admin/AdminDashboard.tsx` | Dashboard + Gemeinden-Tabelle |
| 5 | `src/pages/admin/ChurchDetailDrawer.tsx` | Sheet mit 3 Tabs + Bearbeitung |
| 6 | `src/App.tsx` | Route `/admin` registrieren |

**Reihenfolge:** Migration → Hook → Route-Guard → Dashboard → Drawer → Route
