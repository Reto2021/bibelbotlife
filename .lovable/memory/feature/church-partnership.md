---
name: Church Partnership Pricing
description: Gestaffeltes Pricing-Modell für Gemeinde-Partnerschaft mit Setup + Jahresbeitrag
type: feature
---
## Pricing-Modell (CHF)

| Tier | Setup (einmalig) | Jahr (laufend) |
|------|-------------------|----------------|
| Free (Schnupper) | 0 | 0 |
| Community (<500) | 490 | 790 |
| Gemeinde (500–2000) | 990 | 1'490 |
| Kirche (2000+) | 1'990 | 2'990 |

## DB-Tabellen
- `church_partners` mit `plan_tier` enum: free, community, gemeinde, kirche
- `church_contact_requests` (public INSERT, no public SELECT)

## Routen
- `/for-churches` – Info & Pricing
- `/churches` – Verzeichnis
- `/church/:slug` – Partner-Profil
- `?church=slug` → Banner via localStorage

## Feature Gating
- Free: Verzeichnis + Telegram
- Community: + Partner-Seite, Badge, QR, Kontakt
- Gemeinde: + Pastor-Profil, Video, Analytics, Priority
- Kirche: + Multi-Profile, Custom Branding, API, Account Manager
