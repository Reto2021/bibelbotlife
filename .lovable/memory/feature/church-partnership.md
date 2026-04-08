---
name: Church Partnership & Patronat
description: Patronats-Pakete, Splash-Screen, Gemeinde-Branding (Bot-Name, Farben, Logo im Chat)
type: feature
---
## Patronats-Pakete (CHF/Jahr) – nach Grösse

| Paket | Grösse | Beitrag (Jahr) |
|-------|--------|----------------|
| Senfkorn | bis 50 Mitglieder | CHF 0.– |
| Wegbegleiter | 50–200 Mitglieder | CHF 490.– |
| Brückenbauer (Top-Wahl) | 200–500 Mitglieder | CHF 990.– |
| Leuchtturm | 500+ Mitglieder | CHF 1'990.– |

## Gemeinde-Branding
- `custom_bot_name` – Eigener Bot-Name (z.B. "ReformierterBot")
- `primary_color` – Hex-Farbe, wird dynamisch als CSS `--primary` überschrieben
- `secondary_color` – Optional
- Logo im Chat-Header + Splash-Screen
- Direktlink zur Gemeindeseite im Banner und Chat
- Verwaltung: Direkt über Lovable Cloud Backend (kein Admin-UI)

## Splash-Screen (Patronat)
- `SplashScreen.tsx`: BibelBot-Logo + custom_bot_name + Partner-Logo
- Nur für bezahlte Tiers (community, gemeinde, kirche)
- Pro Session einmal (sessionStorage)

## DB-Tabellen
- `church_partners` mit: plan_tier, custom_bot_name, primary_color, secondary_color, logo_url
- `church_contact_requests` (public INSERT, no public SELECT)

## Routen
- `/for-churches` – Info & Patronats-Pakete
- `/churches` – Verzeichnis
- `/church/:slug` – Partner-Profil
- `?church=slug` → Banner + Splash + Branding via localStorage

## Hooks
- `useChurchBranding()` – Cached Branding-Daten aus church_partners
- `ChurchColorOverride` (App.tsx) – Dynamische CSS-Variable-Überschreibung
