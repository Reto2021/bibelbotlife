---
name: Church Partnership & Patronat
description: Patronats-Pakete, Splash-Screen mit Logo für bezahlte Partner, plan_tier steuert Sichtbarkeit
type: feature
---
## Patronats-Pakete (CHF/Jahr) – nach Grösse

| Paket | Grösse | Beitrag (Jahr) |
|-------|--------|----------------|
| Senfkorn | bis 50 Mitglieder | CHF 0.– |
| Wegbegleiter | 50–200 Mitglieder | CHF 490.– |
| Brückenbauer (Top-Wahl) | 200–500 Mitglieder | CHF 990.– |
| Leuchtturm | 500+ Mitglieder | CHF 1'990.– |

Alle Pakete bieten denselben Funktionsumfang. Der Preis richtet sich nach Gemeindegrösse.

## Splash-Screen (Patronat)
- `SplashScreen.tsx`: Zeigt BibelBot-Logo + Partner-Logo/Name bei App-Start
- Logo nur für bezahlte Tiers (community, gemeinde, kirche) — nicht für free
- Erscheint nur bei PWA-Standalone oder wenn `?church=slug` / localStorage gesetzt
- Pro Session nur einmal (sessionStorage)
- Partner-Daten aus `church_partners` (slug, logo_url, name, plan_tier)

## DB-Tabellen
- `church_partners` mit `plan_tier` enum: free, community, gemeinde, kirche
- `church_contact_requests` (public INSERT, no public SELECT)

## Routen
- `/for-churches` – Info & Patronats-Pakete
- `/churches` – Verzeichnis
- `/church/:slug` – Partner-Profil
- `?church=slug` → Banner via localStorage + Splash-Screen
