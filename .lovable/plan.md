

## OG-Image für BibleBot.Life erstellen

### Was wird gemacht
Ein neues Open-Graph-Bild (1200×630px) im Branding der «Goldenen Stunde»-Palette, das bei Social Sharing (WhatsApp, Telegram, LinkedIn, Facebook, Twitter) angezeigt wird.

### Design-Konzept
- **Hintergrund**: Warmer cremig-goldener Gradient (Honig-Gold → Petrol-Akzent)
- **Titel**: «BibleBot.Life» in eleganter Serif-Schrift (Lora Bold oder YoungSerif)
- **Untertitel**: «Your Personal Bible Companion» in schlanker Sans-Serif
- **Visuelles Element**: Dezentes Buch-/Bibel-Icon oder Kreuz-Symbol, subtil eingearbeitet
- **Emojis**: ✝️ als visueller Anker
- **Farbpalette**: Primary #C8883A (Honig-Gold), Secondary hsl(185,45%,35%) (Petrol), Background cremig-warm

### Technische Umsetzung
1. Python-Script mit Pillow erstellen, das das OG-Image generiert (1200×630px JPG)
2. Fonts: Lora Bold für den Titel, InstrumentSans für den Untertitel (aus Canvas-Fonts)
3. Output nach `public/og-image.jpg` (ersetzt das bestehende)
4. QA: Bild visuell prüfen auf Lesbarkeit, Kontrast, korrekte Grössen

### Dateien
- **Erstellt**: `public/og-image.jpg` (neues OG-Image)
- **Keine Code-Änderungen nötig** – `index.html` referenziert bereits `og-image.jpg`

