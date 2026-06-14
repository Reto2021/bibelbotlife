# Plan: Virale Features – Share-Karte + Embed-Widget

Beide Features parallel, in 2 Phasen lieferbar.

---

## Feature 1: "Dein Vers" – Personalisierte Vers-Share-Karte

### A) Landingpage `/mein-vers`
- 3-stufiges Mini-Flow (Single-Page, ohne Login):
  1. **Stimmung wählen** (6 Karten: dankbar, ängstlich, traurig, suchend, hoffnungsvoll, müde)
  2. **Lebensbereich** (4 Karten: Arbeit, Familie, Glaube, Sinn)
  3. **Optionaler Satz** ("Worum geht's gerade?" – Freitext, max. 200 Zeichen, kann übersprungen werden)
- Danach: Loading-Animation → KI wählt 1 passenden Vers + 2-Satz-Erklärung
- Ergebnis-Screen mit grosser Share-Karte + Buttons: WhatsApp, Telegram, Instagram-Story, Download PNG, Kopier-Link, "Neuer Vers"
- CTA unten: "Frag den BibleBot ein Folgendetail →" → öffnet Chat mit Vorkontext

### B) Chat-Integration
- Nach jeder Assistant-Antwort, die mind. einen Bibelvers zitiert: dezenter Button **"Als Karte teilen"** unter der Nachricht
- Öffnet Modal mit derselben Karte (Vers + Erklärung aus dem Chat-Turn) und denselben Share-Optionen

### C) Karten-Rendering (Edge Function `generate-verse-card`)
- Format: 1080×1920 PNG (Instagram/WhatsApp Story-Format) + 1200×630 (OG/Link-Preview)
- Inhalt: Vers gross, Referenz, kurze Erklärung, "biblebot.life", QR-Code zur Landingpage mit `?ref=card&v=<id>`
- Design: Golden-Hour-Palette, ruhige Typografie, warmer Verlauf
- Storage: Bucket `share-images` (existiert bereits, public)
- Cache: gleiche Vers+Stimmungs-Kombi wird wiederverwendet (Hash-Key)

### D) Tracking
- Neue Events: `verse_card_created`, `verse_card_shared` (mit channel: whatsapp/telegram/instagram/download/link), `verse_card_landing_view`, `verse_card_from_chat`
- Conversion-Funnel sichtbar in Admin-Analytics

---

## Feature 2: Embed-Widget (öffentlich für alle)

### A) Widget-Script `public/embed.js`
- 1-Zeilen-Snippet: `<script src="https://biblebot.life/embed.js" data-color="#C8883A" data-name="Frag den BibleBot" defer></script>`
- Erzeugt floating Chat-Bubble unten rechts auf jeder Seite
- Klick öffnet Iframe mit `/embed?host=<domain>&color=...&name=...`
- Optionen via `data-*`: Farbe, Bot-Name, Position (bottom-right/bottom-left), Sprache

### B) Embed-Seite `/embed`
- Schlanke Chat-UI ohne Header/Footer, optimiert für Iframe
- Eigene Sprach- und Farbauswahl via URL-Params
- Footer-Link "Powered by biblebot.life" (klein, dezent) – nicht entfernbar, virale Verbreitung
- Tracking: `host` Domain wird mitgeloggt, sichtbar im Admin-Dashboard ("Wo läuft das Widget?")

### C) Generator-Seite `/widget`
- Öffentlich, kein Login
- Live-Vorschau + Konfigurator (Farbe, Name, Position, Sprache)
- Copy-Snippet-Button
- Kurze Anleitung "So bindest du es ein"
- CTA für Gemeinden: "Möchtest du Branding ohne 'Powered by'? → Patronat"

### D) Analytics
- Neue Events: `embed_widget_loaded` (mit host), `embed_chat_opened`, `embed_message_sent`
- Admin-Liste: Top-Hosts nach Nutzung

---

## Technische Details

**Neue Dateien:**
- `src/pages/MeinVers.tsx` – Landingpage Flow
- `src/components/VerseCard.tsx` – Visual-Komponente (auch als React für Karten-Render)
- `src/components/ShareVerseModal.tsx` – Modal aus Chat
- `src/pages/Embed.tsx` – schlanke Chat-Variante
- `src/pages/WidgetGenerator.tsx` – `/widget` Konfigurator
- `public/embed.js` – Loader-Script
- `supabase/functions/generate-verse-card/index.ts` – Karten-PNG via Satori/Resvg oder via HTML→Image-Service
- `supabase/functions/pick-verse-for-mood/index.ts` – Verswahl-Endpoint (Lovable AI Gateway)
- DB-Migration: `verse_cards` Tabelle (id, mood, area, prompt, verse_ref, verse_text, explanation, image_url, ref_count, created_at) + RLS

**Geänderte Dateien:**
- `src/App.tsx` – Routen `/mein-vers`, `/embed`, `/widget`
- `src/components/BibelBotChat.tsx` – "Als Karte teilen"-Button
- `index.html` / SEO – Meta für `/mein-vers` (viraler Anker)

**KI-Stack:** Lovable AI Gateway (Gemini Flash) für Verswahl & Erklärung – kein User-Key.

**Karten-Rendering:** Edge Function mit `npm:satori` + `npm:@resvg/resvg-js` (HTML/JSX → SVG → PNG). Bewährt, schnell, deterministisch.

---

## Phasen / Lieferung

**Phase 1 (heute):**
- DB-Migration `verse_cards`
- Edge Functions `pick-verse-for-mood` + `generate-verse-card`
- Seite `/mein-vers` (3-Step-Flow + Ergebnis + Share-Buttons)
- "Als Karte teilen"-Button im Chat + Modal
- Tracking-Events

**Phase 2 (gleich danach):**
- `public/embed.js` Loader
- `/embed` schlanke Chat-Seite
- `/widget` Generator mit Live-Preview
- Admin: Top-Hosts-Übersicht

---

## Was NICHT in diesem Plan

- Push-Benachrichtigung „Dein Vers wurde 5× geteilt" – später, wenn Daten da
- A/B-Test verschiedene Kartenstile – nach 2 Wochen Daten
- WhatsApp-Daily-Verse-Kanal (Feature 3) – separate Entscheidung
