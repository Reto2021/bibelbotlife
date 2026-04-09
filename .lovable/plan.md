
# Phase 7: Super-Admin Panel ✅

Geschütztes Verwaltungs-Panel unter `/admin` — vollständig implementiert.

## Umgesetzt

1. **DB: Rollen-System** — `user_roles` Tabelle, `app_role` Enum, `has_role()` Security-Definer-Funktion
2. **RLS-Policies** — Admins können alle Gemeinden (auch inaktive), Abonnenten, Analytics, Kontaktanfragen lesen/bearbeiten
3. **Route-Guard** — `ProtectedAdminRoute` prüft Rolle via RPC (kein localStorage)
4. **Admin Dashboard** — Stats-Kacheln (Gemeinden, Abos, Abonnenten, Chats) + Gemeinden-Tabelle mit Suche/Filter
5. **Detail-Drawer** — 3 Tabs (Profil, Abo & Billing, Nutzung) mit Bearbeitungsmöglichkeit
6. **Admin-Link** — Im Header nur für Admins sichtbar (Shield-Icon)

## Nächste Schritte (noch offen)

- Admin-Rolle einem Benutzer zuweisen (manuell via DB oder Admin-UI)
- Gemeinde-Erstellung durch Admin
- Export-Funktionen (CSV)
