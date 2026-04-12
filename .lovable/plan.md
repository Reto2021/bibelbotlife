

## Plan: Share-Bild mit Intro-Text, Hashtags und Gemeinde-Sponsoring

### Was wird gemacht

Wenn ein Nutzer auf "Bild teilen" klickt, wird automatisch ein passender Intro-Text mit Hashtags generiert und beim Teilen mitgegeben. Bei gesponsorten Gemeinden (church branding aktiv) wird die Gemeinde sowohl im Bild als auch im Share-Text erwähnt.

### Bestandsaufnahme (bereits vorhanden)

- `useChurchBranding()` Hook — liefert churchName, logoUrl, primaryColor etc.
- `ChurchBanner` — zeigt Gemeinde-Banner bei `?church=slug`
- `BrandedQRCode` — QR-Code mit BibleBot-Logo
- `QRFlyerDownload`, `QRStickerDownload` — Flyer/Sticker-Download für Gemeinden
- `SplashScreen` — zeigt Partner-Logo bei Patronat
- Share-Flow in `DailyImpulse.tsx` → `shareAsImage()` nutzt bereits `navigator.share()` mit Text

### Änderungen

**1. Share-Text mit Intro + Hashtags (`src/components/DailyImpulse.tsx`)**

- `shareAsImage()` erweitern: statt nur Vers + Referenz wird ein vollständiger Post-Text generiert:
  ```
  ✨ {teaser}

  «{verse}»
  — {reference}

  #BibleBotLife #Tagesimpuls #{topic} #Bibel
  biblebot.life
  ```
- Bei aktiver Gemeinde-Branding:
  ```
  ✨ {teaser}

  «{verse}»
  — {reference}

  📍 Empfohlen von {churchName}

  #BibleBotLife #Tagesimpuls #{topic} #{churchName}
  biblebot.life/?church={slug}
  ```

**2. Gemeinde-Logo + Name im Bild (`src/lib/share-image-canvas.ts`)**

- `ShareTileOptions` erweitern um optionale `churchBranding: { name, logoUrl, slug }`.
- Im unteren Branding-Bereich: Wenn `churchBranding` vorhanden, neben "BibleBot.Life" ein kleines "Empfohlen von {churchName}" und optional das Gemeinde-Logo anzeigen.
- Layout: Links "BibleBot.Life" + "Everyday Sunday", rechts unten kleines Gemeinde-Logo + Name.

**3. Integration in DailyImpulse**

- `useChurchBranding()` importieren und Branding-Daten an `generateShareImage()` und `shareAsImage()` weitergeben.
- Hashtags werden sprachabhängig generiert (DE: #Bibel, EN: #Bible, etc.) mit Basis-Set + topic-basiertem Tag.

**4. Clipboard-Fallback**

- Wenn `navigator.share` nicht verfügbar: Text wird in Zwischenablage kopiert mit Toast-Hinweis "Text kopiert — füge ihn beim Posten ein".

### Technische Details

| Datei | Änderung |
|-------|----------|
| `src/lib/share-image-canvas.ts` | `ShareTileOptions` + `churchBranding` Feld; Gemeinde-Logo laden + im Canvas unten rechts zeichnen; "Empfohlen von X" Text |
| `src/components/DailyImpulse.tsx` | `useChurchBranding()` importieren; Share-Text Builder-Funktion mit Hashtags + Gemeinde; an `generateShareImage` + `navigator.share` übergeben |
| `src/i18n/locales/de.json` | Neue Keys: `share.introPrefix`, `share.recommendedBy`, `share.hashtagBible` |
| `src/i18n/locales/en.json` | Gleiche Keys auf Englisch |
| Alle anderen Locale-Dateien | Übersetzte Versionen der neuen Keys |

