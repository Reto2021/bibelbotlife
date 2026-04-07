

## Pricing-Modell: Setup + Jahresbeitrag, gestaffelt

### Empfehlung: Gestaffeltes Setup

Ein einheitliches Setup wäre einfacher, aber gestaffelt ist fairer – grössere Gemeinden brauchen mehr Onboarding, Custom Branding etc.

```text
┌──────────────────────┬────────────┬────────────┬──────────────────────────────────┐
│ Tier                 │ Setup      │ Jahr       │ Leistungen                       │
│                      │ (einmalig) │ (laufend)  │                                  │
├──────────────────────┼────────────┼────────────┼──────────────────────────────────┤
│ FREE                 │ CHF 0      │ CHF 0      │ Verzeichnis-Eintrag              │
│ (Schnupper)          │            │            │ + Telegram-Gruppe                │
├──────────────────────┼────────────┼────────────┼──────────────────────────────────┤
│ COMMUNITY            │ CHF 490    │ CHF 790    │ Partner-Seite, Badge,            │
│ (<500 Mitglieder)    │            │ /Jahr      │ QR-Flyer, Kontaktformular,       │
│                      │            │            │ Telegram-Gruppe + Impulse        │
├──────────────────────┼────────────┼────────────┼──────────────────────────────────┤
│ GEMEINDE             │ CHF 990    │ CHF 1'490  │ + Pastor-Profil, Willkommens-    │
│ (500–2000 Mitgl.)    │            │ /Jahr      │ video, Analytics-Dashboard,      │
│                      │            │            │ Priority-Support                 │
├──────────────────────┼────────────┼────────────┼──────────────────────────────────┤
│ KIRCHE               │ CHF 1'990  │ CHF 2'990  │ + Mehrere Profile, Custom        │
│ (2000+ Mitglieder)   │            │ /Jahr      │ Branding, API-Zugang,            │
│                      │            │            │ Dedicated Account Manager        │
└──────────────────────┴────────────┴────────────┴──────────────────────────────────┘
```

### Warum gestaffeltes Setup

- **Free**: Kein Setup nötig – selbst eintragen, Türöffner
- **Community (CHF 490)**: Setup umfasst Profil-Einrichtung, QR-Flyer-Erstellung, Onboarding-Call
- **Gemeinde (CHF 990)**: Zusätzlich Video-Integration, Analytics-Setup, persönliches Onboarding
- **Kirche (CHF 1'990)**: Custom Branding, Multi-Profil-Konfiguration, Strategie-Workshop

### Jahresvergleich mit Markt

```text
                    Jahr 1          Ab Jahr 2
                    (Setup+Abo)     (nur Abo)
BibleBot Community: CHF 1'280      CHF 790
BibleBot Gemeinde:  CHF 2'480      CHF 1'490
BibleBot Kirche:    CHF 4'980      CHF 2'990

ChurchTools:        EUR 1'188–4'788/Jahr
Tithe.ly:           USD 588–2'388/Jahr
```

→ BibleBot ist im Mittelfeld – nicht billig, aber günstiger als die grossen Player. Bei wachsendem Feature-Set können Preise später steigen.

### Optionale Extras (Add-ons)

Zusätzliche Einnahmequellen pro Gemeinde:
- **Zusätzliche Pastor-Profile**: CHF 190/Jahr pro Profil
- **Custom Domain** (z.B. bibel.refkirche-brugg.ch): CHF 290/Jahr
- **Erweiterte Analytics**: CHF 390/Jahr
- **Mehrsprachige Partner-Seite** (z.B. DE+FR für bilinguale Gemeinden): CHF 290/Jahr

### Technische Umsetzung

Zum bisherigen Plan ändert sich nur:
- `church_partners` Tabelle bekommt Feld `plan_tier` mit Werten: `free`, `community`, `gemeinde`, `kirche`
- Pricing-Seite `/for-churches` zeigt 4-Spalten-Tabelle mit Setup + Jahresbeitrag
- Tier bestimmt, welche Features auf der Partner-Seite sichtbar sind (z.B. Video nur ab "Gemeinde")

### Implementierungsplan bleibt gleich

Alle Dateien und Komponenten wie im letzten Plan. Einzige Anpassungen:
1. Pricing-Tabelle auf `/for-churches` mit Setup-Spalte
2. Tier-Logic in `ChurchPartner.tsx` (Features je nach Plan ein-/ausblenden)
3. i18n-Keys für Tier-Namen und Setup-Beschreibungen

