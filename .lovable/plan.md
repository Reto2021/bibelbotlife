

## Erweiterte Partner-Felder im Hochzeits-Writer

Der Benutzer möchte pro Partner/in zusätzliche optionale Felder hinzufügen, die bei einer Trauung relevant sind.

### Neue Felder in `WEDDING_CONFIG`

Nach den bestehenden `partnerName1`/`partnerName2`-Feldern werden folgende optionale Felder eingefügt:

**Partner/in 1:**
- `partnerBirthName1` — Geborene (Geburtsname), Text
- `partnerBirthDate1` — Geburtsdatum, Date
- `partnerFrom1` — Von (Herkunftsort), Text
- `partnerConfession1` — Konfession, Select (Reformiert, Katholisch, Lutherisch, Evangelikal, Andere, Keine)

**Partner/in 2:**
- `partnerBirthName2` — Geborene, Text
- `partnerBirthDate2` — Geburtsdatum, Date
- `partnerFrom2` — Von (Herkunftsort), Text
- `partnerConfession2` — Konfession, Select (gleiche Optionen)

Das bestehende `tradition`-Feld bleibt als übergeordnete Konfession/Tradition für die Zeremonie selbst erhalten.

### Änderungen

**1. `src/pages/mein-bereich/CeremonyWriter.tsx`**
- `WEDDING_CONFIG.fields` erweitern mit den 8 neuen Feldern (nach partnerName1/partnerName2, gruppiert)
- PDF-Generierung: Neue Felder im generierten Text berücksichtigen (sofern ausgefüllt)

**2. `src/i18n/locales/de.json`** + `en.json` (und ggf. weitere)
- Neue Übersetzungsschlüssel für Labels:
  - `ceremony.wedding.birthName` — "Geborene"
  - `ceremony.wedding.birthDate` — "Geburtsdatum"  
  - `ceremony.wedding.from` — "Von (Ort)"
  - `ceremony.wedding.confession` — "Konfession"

### Layout-Hinweis
Die Felder werden in der bestehenden Grid-Darstellung gerendert. Da das Config-System alle Felder linear darstellt, erscheinen sie in der Reihenfolge: Name 1, Geborene 1, Geb.datum 1, Von 1, Konfession 1, Name 2, Geborene 2, etc. — oder alternativ gruppiert als Name1/Name2, dann Geborene1/Geborene2 nebeneinander im Grid (wie im Screenshot sichtbar).

