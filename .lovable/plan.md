

## Plan: Abo-Button & Toast-Texte optimieren

### Analyse

Aktuell zeigt der Banner 3 separate kleine Buttons (Push, Telegram, SMS) – das ist visuell überladen und unklar. Besser: **ein einziger CTA-Button** im Banner, der beim Klick die Kanalwahl öffnet.

### Änderungen

**1. Toast-Texte in `de.json` anpassen**
- `toastPushPreview`: "Push-Abo nicht im Preview" → "Benachrichtigungen nicht im Preview"
- `toastPushPreviewDesc`: "Push-Benachrichtigungen funktionieren..." → "Benachrichtigungen funktionieren..."
- `toastNotSupportedDesc`: "...keine Push-Benachrichtigungen" → "...keine Browser-Benachrichtigungen"
- `pushHint`: "Push" raus aus dem Text

**2. Banner-UI in `DailyImpulse.tsx` umbauen**

Statt 3 Buttons im Banner → **ein einziger Button**: **"Inspo abonnieren"** (mit Bell-Icon)

Beim Klick: Banner expandiert und zeigt die 3 Kanal-Optionen (Benachrichtigung, Telegram, SMS) – wie bisher im expanded-Bereich.

Desktop-Banner wird dadurch aufgeräumter: ein klarer CTA statt 3 kleine Buttons.

```text
Vorher:  [Benachrichtigung] [Telegram] [SMS]
Nachher: [🔔 Inspo abonnieren]  →  klick  →  expandiert mit Kanalwahl
```

**3. Betroffene Dateien**
- `src/i18n/locales/de.json` — Toast-Texte + neuer Key `impulse.subscribeButton`
- `src/components/DailyImpulse.tsx` — Banner-Buttons durch einzelnen CTA ersetzen, der `isExpanded` triggert

