---
name: Church Partnership Pricing
description: Patronats-Pakete mit Jahresbeitrag für Gemeinde-Partnerschaft
type: feature
---
## Patronats-Pakete (CHF/Jahr)

| Paket | Beitrag (Jahr) | Leistung |
|-------|----------------|----------|
| Senfkorn | CHF 0.– | Basis-Nutzung des Bots für alle Gemeindeglieder |
| Wegbegleiter | CHF 490.– | Erwähnung als Unterstützer + werbefreier Zugang |
| Brückenbauer (Top-Wahl) | CHF 990.– | Logo im Bot-Interface, monatlicher Nutzungs-Report |
| Leuchtturm | CHF 1'990.– | Eigene Inhalte, Roadmap-Mitgestaltung, Premium-Support |

## DB-Tabellen
- `church_partners` mit `plan_tier` enum: free, community, gemeinde, kirche
- `church_contact_requests` (public INSERT, no public SELECT)

## Routen
- `/for-churches` – Info & Patronats-Pakete
- `/churches` – Verzeichnis
- `/church/:slug` – Partner-Profil
- `?church=slug` → Banner via localStorage
