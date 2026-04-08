

## Rebranding-Plan: BibelBot → BibleBot.Life durchziehen

### Ist-Zustand

Das Rebranding ist im Code **nicht konsistent** umgesetzt. Folgende Stellen verwenden noch alte Bezeichnungen:

| Problem | Stellen |
|---------|---------|
| **Header zeigt "BibleBot"** statt "BibleBot.Life" | `Index.tsx` Zeile 70 |
| **Dateiname `bibelbot-logo.png`** | `src/assets/bibelbot-logo.png` + 9 Import-Stellen |
| **Telegram `meinbibelbot`** | 4 Dateien (DailyImpulse, Index, DailySubscribe, ChurchPartner) |
| **localStorage-Keys mit `bibelbot-`** | `bibelbot-church`, `bibelbot-daily-subscribed`, `bibelbot-name`, `bibelbot-splash-shown` |
| **DEFAULT_BOT_NAME = "BibleBot"** | `BibelBotChat.tsx` Zeile 65 |
| **Komponente heisst `BibelBotChat`** | Dateiname + Exports |

### Änderungen

**1. Header-Text korrigieren**
- `Index.tsx` Zeile 70: `"BibleBot"` → `"BibleBot.Life"` (oder nur "BibleBot" mit ".Life" in kleinerer Schrift darunter, wie im Footer bereits)

**2. Logo-Datei umbenennen**
- `src/assets/bibelbot-logo.png` → `src/assets/biblebot-logo.png`
- Alle 9 Import-Stellen aktualisieren (ChatHero, SplashScreen, Index, Login, ResetPassword, ForChurches, ForInstitutions, ChurchDirectory, Unsubscribe)

**3. Telegram-Link prüfen**
- `https://t.me/meinbibelbot` — Ist der Bot tatsächlich umbenannt? Falls ja → neuen Link einsetzen. Falls nein → bleibt vorerst (Telegram-Bots können nicht umbenannt werden)

**4. localStorage-Keys migrieren (optional, Breaking Change)**
- Keys wie `bibelbot-church`, `bibelbot-splash-shown` etc. sind intern und für User unsichtbar
- Umbenennung optional, würde aber bestehende User-Sessions zurücksetzen
- **Empfehlung**: Vorerst belassen, da rein technisch und nicht sichtbar

**5. Komponenten-/Dateinamen**
- `BibelBotChat.tsx` → interne Benennung, nicht user-facing
- **Empfehlung**: Belassen (Refactoring-Risiko ohne sichtbaren Nutzen)

### Betroffene Dateien

```text
src/assets/biblebot-logo.png        — Umbenannt
src/pages/Index.tsx                  — Header-Text + Import
src/components/ChatHero.tsx          — Import
src/components/SplashScreen.tsx      — Import
src/pages/Login.tsx                  — Import
src/pages/ResetPassword.tsx          — Import
src/pages/ForChurches.tsx            — Import
src/pages/ForInstitutions.tsx        — Import
src/pages/ChurchDirectory.tsx        — Import
src/pages/Unsubscribe.tsx            — Import
```

### Nicht ändern
- `index.html` — bereits korrekt ("BibleBot.Life", "BibleBot – Your Personal Bible Companion")
- `manifest.json` — bereits korrekt ("BibleBot")
- localStorage-Keys — internes Detail, kein Rebranding-Effekt
- Telegram-Link — abhängig vom Bot-Handle, nicht änderbar

