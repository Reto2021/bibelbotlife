

## Plan: Preise verstecken & "Kontakt aufnehmen"-Button + Admin-Toggle

### Übersicht
Alle Preisangaben auf den Seiten "Für Gemeinden" und "Für Seelsorger" werden ausgeblendet und durch einen "Kontakt aufnehmen"-Button ersetzt. Ein Admin-Setting in der Datenbank steuert, ob Preise sichtbar sind oder nicht.

### 1. Datenbank: App-Settings-Tabelle
- Neue Tabelle `app_settings` mit Spalten: `key TEXT PRIMARY KEY`, `value JSONB`, `updated_at TIMESTAMPTZ`
- Eintrag: `key = 'show_pricing'`, `value = false`
- RLS: SELECT für alle (anon + authenticated), UPDATE nur für Admins via `has_role()`

### 2. Hook: `useAppSetting`
- Neuer Hook `src/hooks/use-app-setting.ts`
- Liest einen Setting-Key aus `app_settings` per Supabase query
- Gibt `{ value, isLoading }` zurück
- Admin-Variante mit Mutation zum Updaten

### 3. ForChurches.tsx anpassen
- `useAppSetting('show_pricing')` abfragen
- Wenn `false`: Preise (Setup, Jahresbeitrag, CHF-Referenz) in den Tier-Karten ausblenden
- Stattdessen Text wie "Preise auf Anfrage" und der bestehende "Kontakt"-Button bleibt

### 4. ForCelebrants.tsx anpassen
- Gleiche Logik: Wenn `show_pricing === false`, den Preis (`plan.price`, `plan.period`, CHF-Referenz) ausblenden
- Button-Text auf "Kontakt aufnehmen" ändern, Link zum Kontaktformular statt `/login`

### 5. Admin-Dashboard: Toggle
- Im AdminDashboard oder SettingsPage einen Switch "Preise anzeigen" hinzufügen
- Toggelt `app_settings.show_pricing` zwischen `true`/`false`

### 6. i18n
- Neue Keys: `pricing.onRequest` ("Preise auf Anfrage" / "Prices on request"), `pricing.contactUs` ("Kontakt aufnehmen" / "Contact us")
- In DE und EN, restliche Sprachen als EN-Fallback

### Betroffene Dateien
- **Neu**: Migration für `app_settings`, `src/hooks/use-app-setting.ts`
- **Geändert**: `ForChurches.tsx`, `ForCelebrants.tsx`, `AdminDashboard.tsx`, `de.json`, `en.json`

