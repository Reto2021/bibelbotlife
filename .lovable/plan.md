# Partner-Pitch Deck — BibleBot.Life

Ziel: Ein überzeugendes Deck zur Partnergewinnung (Kirchen, Institutionen, Spitäler, Bildung, Werke). Look: McKinsey/BCG-Rigor (klare Pyramide, Data-driven, „so-what"-Titel, saubere 2-Spalten-Layouts, dezente Farbakzente) — Feel: HubSpot (warm, menschlich, Nutzenversprechen, klare CTAs, illustrativ).

## Prinzipien (Design & Rhetorik)

- **Titel = Botschaft**, nicht Thema. Jede Slide-Headline ist die „So-what"-Aussage in einem Satz.
- **Ein Gedanke pro Slide.** Max. 30 Wörter Fliesstext, Rest visuell.
- **Pyramide**: These → Begründung (3 Punkte) → Beleg (Zahl/Zitat/Chart).
- **Farbe sparsam**: Warm Honey-Gold (Primary) als Akzent, Deep Teal für Data-Highlights, Creme als Basis. Dark Cover + Close ("Sandwich").
- **Typo**: Instrument Serif (Titel) + Inter Tight (Body) — passt zum aktuellen App-Design; alternativ Fraunces + Inter.
- **Chart-Regel**: One insight per chart, Insight steht als Subheadline drüber.

## Struktur (18 Slides, ~15 Min)

**Teil 1 — Hook (Slides 1–3)**
1. **Cover**: „Die Bibel. Im Leben. Jeden Tag." + Sub: Partner-Programm 2026. Dunkler Hintergrund, Logo, Kontakt.
2. **Warum jetzt**: 3 Kurven — Kirchenaustritte ↑, Sinnsuche & Mental-Health-Suchen ↑, KI-Adoption ↑. So-what: „Menschen suchen Orientierung digital — nicht mehr im Pfarrhaus."
3. **Das Problem in einem Satz**: Kirchen erreichen die Suchenden nicht dort, wo sie fragen — auf dem Handy, nachts, anonym.

**Teil 2 — Lösung (Slides 4–7)**
4. **Was BibleBot.Life ist**: Persönlicher Bibel-Begleiter. Anonym, 36 Sprachen, 5 Übersetzungen, Coaching-Methodik. Screenshot Chat.
5. **Wie es sich anfühlt**: 3 echte Nutzer-Dialoge (Angst, Trauer, Zweifel) — Vorher/Nachher.
6. **Was es kann (Feature-Matrix)**: Chat · Daily Impulse · Bibelsuche · Gebetswand · Quiz · Mein Bereich · Messeplaner. Kompakte 2×4-Grid.
7. **Was es NICHT ist**: Kein Ersatz für Seelsorge, keine Denomination, keine Datensammlung. (Vertrauensanker.)

**Teil 3 — Traction & Proof (Slides 8–10)**
8. **Zahlen** (Stat-Slide, 3 grosse Kacheln): Nutzer, Chats, Länder — Quelle: interne Analytics.
9. **Stimmen**: 3 Testimonials (Nutzer + Pastor + Institution).
10. **Wirkung**: „Fragen, die sonst niemand hört" — 4 anonymisierte Beispielthemen mit Verteilung.

**Teil 4 — Partnerangebot (Slides 11–14)**
11. **Warum Partner werden**: 3 Nutzen — Reichweite, Modernität, Entlastung Seelsorge.
12. **Wie Partnerschaft aussieht**: Co-Branding im Chat, eigene Splash, Gemeindeseite, QR-Materialien, Kontaktweiterleitung.
13. **Pakete** (aus `church-partnership.md`): Senfkorn (0), Wegbegleiter (490), Brückenbauer (990, empfohlen), Leuchtturm (1'990). Klare Feature-Tabelle.
14. **Institutionen-Track**: Starter/Professional/Enterprise (aus `ForInstitutions.tsx`) — für Spital, HR, Versicherer.

**Teil 5 — Umsetzung & Vertrauen (Slides 15–17)**
15. **Onboarding in 14 Tagen**: Timeline (Kickoff → Branding → Launch → Review).
16. **Sicherheit & Datenschutz**: Schweiz-Hosting, RLS, keine Werbung, DSG-konform, keine Nutzerdaten an Dritte.
17. **Team & Trägerschaft**: 2Go Media AG, ökumenisch, Beirat.

**Teil 6 — CTA (Slide 18)**
18. **Call to Action** — 3 klare Optionen:
    - **Pilot starten** (30 Tage kostenlos, 1 Klick)
    - **Gespräch buchen** (Calendly-Link/QR)
    - **Material erhalten** (Onepager + Flyer PDF)
    Kontakt + QR + E-Mail gross. Dark Close-Slide.

## Empfohlener Primary-CTA

**„Starten Sie einen 30-Tage-Pilot — kostenlos, gebrandet, unverbindlich."**
Begründung: Senkt Entscheidungsdruck, macht das Produkt erlebbar (statt zu erklären), führt organisch ins Brückenbauer-Paket. Sekundär: Gespräch buchen (für Enterprise/Institutionen).

## Format & Lieferung

- **Format**: 16:9, PDF + Keynote/PowerPoint-fähig. Zusätzlich Web-Version als eigene Route (`/pitch`) mit denselben Slides — durch Prospects browserbar, teilbar per Link, analytics-fähig.
- **Assets**: App-Screenshots (Chat, Daily Impulse, Church Profile), 3 anonyme Dialog-Auszüge, Logo-Varianten (bereits vorhanden), QR mit BibleBot-Logo (`BrandedQRCode`).
- **Sprache**: DE primär, EN-Version parallel (i18n-Keys wiederverwendbar).

## Technische Umsetzung (falls gewünscht)

Zwei Wege — wähle einen:

**A) Web-Deck als Route `/pitch`** (empfohlen)
- Nutzt bestehende Design-Tokens, Fonts, Komponenten.
- Fixed-Resolution-Scaling (1920×1080) wie im slides-app-Pattern.
- Keyboard-Nav, Präsentiermodus, PDF-Export via `Cmd+P`.
- Tracking: welche Slide wie lange angesehen → Sales-Signal.
- Teilbar per Link mit Passwort-/Token-Schutz optional.

**B) Statisches PDF via `pptxgenjs` oder `docx`-Skill**
- Einmalig generiert, offline verteilbar.
- Weniger flexibel, aber sofort E-Mail-tauglich.

## Offene Fragen vor Bau

1. **Zielgruppe erste Version**: Kirchen (Patronat) *oder* Institutionen (Spital/HR) *oder* beides in einem Deck mit Track-Weiche?
2. **Sprache**: DE-only start, oder DE+EN parallel?
3. **Format**: Web-Deck (`/pitch`) oder statisches PDF — oder beides (Web zuerst, PDF-Export daraus)?
4. **Zahlen**: Darf ich echte Zahlen aus `analytics_events` ziehen, oder platzhalten wir?

Sobald du diese vier beantwortest, baue ich das Deck in einem Rutsch.
