
# Phase 7: Super-Admin Panel

Internes Verwaltungs-Panel für BibleBot.Life-Betreiber. Geschützte Route `/admin` mit Rollen-basiertem Zugang.

---

## 1. DB: Admin-Rollen-System

Neue `user_roles` Tabelle (Best Practice — keine Rollen auf Profil-Tabelle):

```text
user_roles
├── id (uuid, PK)
├── user_id (uuid, NOT NULL, FK → auth.users)
├── role (enum: admin, moderator, user)
├── UNIQUE(user_id, role)
```

Security-Definer-Funktion `has_role(user_id, role)` für RLS-Policies ohne Rekursion.

RLS: Nur Admins können `user_roles` lesen. Kein öffentlicher Zugang.

---

## 2. Admin Dashboard (`/admin`)

Übersichts-Kacheln mit Live-Zahlen:

| Kachel | Datenquelle |
|---|---|
| Gemeinden gesamt | `COUNT(church_partners)` |
| Aktive Abos | `WHERE subscription_status = 'active'` |
| Ablaufende Abos (30 Tage) | `WHERE subscription_expires_at < now() + 30 days` |
| Chat-Nachrichten heute | `COUNT(chat_messages) WHERE today` |
| Tagesimpuls-Abonnenten | `COUNT(daily_subscribers WHERE is_active)` |

Darunter: **Gemeinden-Tabelle** mit Suche, Filter nach Plan-Tier und Status.

Spalten: Name, Stadt, Plan, Status, Abo-Ablauf, Erstellt

---

## 3. Gemeinde-Detail-Drawer

Klick auf Gemeinde öffnet Sheet/Drawer mit:

**Tab 1 – Profil:**
- Name, Slug, Konfession, Stadt, Land
- Kontaktperson, E-Mail, Telefon, Website
- Logo-Vorschau

**Tab 2 – Abo & Billing:**
- Plan-Tier (änderbar: free/community/gemeinde/kirche)
- Abo-Status, Start, Ablauf
- Rechnungsadresse, IBAN
- Billing-Intervall (monatlich/jährlich)

**Tab 3 – Nutzung:**
- Anzahl Services, Team-Mitglieder, Records
- Letzte Aktivität (updated_at)

**Aktionen:**
- Plan ändern (Dropdown)
- Abo verlängern (Datum-Picker)
- Gemeinde deaktivieren/aktivieren (Toggle)

---

## 4. Route-Schutz

- `ProtectedAdminRoute` Komponente prüft `has_role(auth.uid(), 'admin')` via Supabase RPC
- Kein localStorage/sessionStorage für Admin-Check
- Nicht-Admins sehen 403 / Redirect

---

## 5. Technische Übersicht

| Datei | Änderung |
|---|---|
| DB-Migration | `user_roles` Tabelle, `app_role` Enum, `has_role()` Funktion, RLS |
| `src/pages/admin/AdminDashboard.tsx` | Dashboard mit Kacheln + Gemeinden-Tabelle |
| `src/pages/admin/ChurchDetailDrawer.tsx` | Sheet mit 3 Tabs |
| `src/hooks/use-admin.ts` | Hook: Rollen-Check, Gemeinden laden, Stats |
| `src/components/ProtectedAdminRoute.tsx` | Route-Guard mit RPC-Check |
| `src/App.tsx` | Route `/admin` registrieren |

**Reihenfolge:**
1. DB-Migration (Rollen-Tabelle + Funktion)
2. Admin-Route-Schutz
3. Dashboard mit Stats
4. Gemeinden-Tabelle mit Suche/Filter
5. Detail-Drawer mit Bearbeitung
