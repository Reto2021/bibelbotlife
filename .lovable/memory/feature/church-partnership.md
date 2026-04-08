---
name: Church Partnership Pricing
description: Patronats-Pakete nach Gemeindegrösse gestaffelt
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
Keine Feature-Versprechungen wie "Powered by" Sponsoren-Logos etc.

## DB-Tabellen
- `church_partners` mit `plan_tier` enum: free, community, gemeinde, kirche
- `church_contact_requests` (public INSERT, no public SELECT)

## Routen
- `/for-churches` – Info & Patronats-Pakete
- `/churches` – Verzeichnis
- `/church/:slug` – Partner-Profil
- `?church=slug` → Banner via localStorage
