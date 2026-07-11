# BibleBot.Life — Grosser Rework in Phasen

Ziel: das beste Bibel-Erlebnis für **Suchende & Seelsorge** — warm, präzise, mit smarten „Bible Moments", die die Bibel kontextuell (Ort · Zeit · Stimmung) in den Alltag bringen.

Kein Big-Bang. Vier klar getrennte Phasen, jede für sich release-fähig.

---

## Phase 1 — Design-Refresh (Golden Hour v2)

**Ansatz:** Palette bleibt warm, aber Typo, Motion und Layering werden mutig moderner.

- Neue Display-Font (z. B. *Fraunces* oder *Instrument Serif*) für Headlines + *Inter Tight* für Body — löst „Standard-AI-Look" ab.
- Layering: sanfte Gradienten (`--gradient-hero`, `--gradient-cta`), warme Schatten (`--shadow-warm`), gläserne Cards mit Backdrop-Blur.
- Motion-System via Framer Motion: eine getragene Hero-Animation (Kerzenlicht-Flimmern hinter Wortmarke), reduzierte Micro-Interactions sonst.
- Neue Iconografie: kein `Sparkles` mehr als Agent-Identität — eigener Bildmarker (bereits vorhanden: gold dove favicon → als App-Logo hochziehen).
- Dark Mode neu abgestimmt (tiefes Teal-Schwarz statt Grau).
- Redesign konzentriert auf: **Landing (`Index`)**, **Chat-Surface**, **Daily Impulse**, **Mein Bereich Home**. Admin/Dashboard bleiben unangetastet.
- Design-Direktionen werden über `design--create_directions` mit 3 Varianten präsentiert; du wählst eine, wir committen die Tokens.

## Phase 2 — Chat-UX & AI Tech Stack

**Chat komplett auf AI Elements + AI SDK Streaming.**

- Migration `bibelbot-chat` Edge Function auf `streamText` + `toUIMessageStreamResponse` (AI SDK), Default-Modell **`openai/gpt-5.5`** mit `service_tier: "priority"` für spürbar tiefere Latenz.
- QA-Agent (`bibelbot-qa`) auf `openai/gpt-5.4` mit strukturierter Output-Verifikation der Zitate.
- Client: `useChat` mit `DefaultChatTransport`, `AI Elements`-Komponenten (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Shimmer`, `Tool`).
- **Umschaltbare Modi** im Composer (Chip-Row): *Companion* (aktuell), *Study* (mit Cross-Refs & Kommentar-Snippets), *Sermon Prep* (nur Login).
- Tool-Calls sichtbar als collapsible Cards: „Vers geprüft", „Kreuzverweis geladen", „Kontext aus Zürcher Bibel".
- Voice-Mode überarbeitet: gleiche AI-Elements-Basis, mit sichtbaren Zwischenzuständen (aufnehmen → transkribieren → antworten → sprechen).
- Streaming-Fehler (429 Rate, 402 Credits) mit klaren Toasts.

## Phase 3 — Bible Moments (dein Kern-Wunsch)

Contextual Trigger, die Bibel proaktiv & relevant in den Tag pushen — **opt-in, datenschutzfreundlich**.

**Trigger-Typen:**
1. **Zeit-Moment** — Aufwachen, Mittagspause, Feierabend, Sonntag früh. Fixe Slots + selbst wählbare Zeiten.
2. **Orts-Moment** — bei Ankunft an markierten Orten (Zuhause, Arbeit, Kirche, Klinik/Spital). Geofencing rein clientseitig via Web Geolocation + PWA Background Sync (soweit browserseitig möglich).
3. **Stimmungs-Moment** — täglicher 1-Tap Mood-Check (bereits Ansatz `MoodSymbol`) triggert kuratierten Vers + Kurzimpuls.
4. **Wetter-/Saison-Moment** — Regen, erster Schnee, Herbstlicht → passende Psalmen/Sprüche.
5. **Ereignis-Moment** — Geburtstage, Jahrestage, selbst gesetzte „schwere Tage" (Trauer, Prüfung).

**Umsetzung:**
- Neue Tabelle `bible_moments` (user_id, trigger_type, config jsonb, active, delivery_channel [push|inapp|sms], quiet_hours) + RLS.
- Neue Tabelle `bible_moment_deliveries` (log, für Analytics & „nicht doppelt senden").
- Edge Function `bible-moment-dispatch` (cron alle 15 min): matched aktive Moments → wählt Vers via `pick-verse-for-mood`-Logik erweitert um Kontext → sendet Web Push / In-App-Card / SMS.
- Client: neuer Bereich **„Meine Momente"** in `Mein Bereich` — Karten-basierter Editor pro Trigger, Preview des nächsten Impulses.
- Push via bestehendem Service Worker; Permission-Flow mit klarer Wertversprechen-Karte („BibleBot findet für dich Momente…").
- Location-Trigger nur bei explizitem Opt-in mit sichtbarem „Warum wir das fragen"-Erklärer; Koordinaten werden **nie serverseitig gespeichert**, nur clientseitig geprüft; Server erhält nur den Event „arrived_at_home".
- Neue In-App-Surface: **Moment-Card** als Overlay (nicht Modal-blocker) mit Vers, 1-Zeilen-Impuls, „Weiterlesen im Chat"-CTA.

## Phase 4 — Performance & PWA-Politur

- Route-basiertes Prefetching + `React.lazy` Cleanup.
- Bilder auf AVIF, `loading="lazy"` durchsetzen.
- Service Worker: stale-while-revalidate für Bibelverse, offline Fallback für letzte 30 Chat-Threads.
- Lighthouse-Ziel: 95+ auf allen vier Kernseiten.
- Sitemap + hreflang-Audit nach Design-Refresh.

---

## Technische Details

**Neue/geänderte Dateien (High-Level):**
- `src/index.css`, `tailwind.config.ts` — neue Tokens, Typo, Gradients.
- `src/components/ai-elements/*` — via `bunx ai-elements add conversation message prompt-input tool shimmer`.
- `src/pages/Index.tsx`, `src/components/BibelBotChat.tsx`, `src/components/ChatHero.tsx`, `src/components/VoiceMode.tsx` — refactored auf AI Elements.
- `supabase/functions/bibelbot-chat/index.ts` — Migration auf AI SDK `streamText`, Modell auf `openai/gpt-5.5` (priority).
- `supabase/functions/bibelbot-qa/index.ts` — `openai/gpt-5.4` mit `Output.object`.
- Neu: `supabase/functions/bible-moment-dispatch/index.ts` + Cron via Lovable Cloud Jobs.
- Neu: `src/pages/mein-bereich/BibleMoments.tsx`, `src/hooks/use-bible-moments.ts`.
- Migration: `bible_moments`, `bible_moment_deliveries` mit RLS, GRANT `authenticated`.

**Modell-Auswahl:**
- Chat-Default: `openai/gpt-5.5` (fast mode)
- Zitatprüfung: `openai/gpt-5.4` (Reasoning)
- Vers-Auswahl für Moments: `google/gemini-3-flash-preview` (billig, schnell)
- Voice: bestehende ElevenLabs-Pipeline bleibt

**Datenschutz für Bible Moments:**
- Geolocation client-only, nie in DB.
- Alle Moments per default OFF, explizites Opt-in pro Trigger.
- Quiet Hours default 22:00–07:00.
- One-Tap „Alle Moments pausieren".

---

## Reihenfolge & Freigaben

1. **Jetzt starten mit Phase 1 (Design)** — ich generiere 3 Design-Direktionen für die Landing, du wählst.
2. Nach Freigabe der Direktion: Design-Tokens ausrollen, dann Chat-UI (Phase 2) darauf aufbauen.
3. Phase 3 (Bible Moments) parallel spezifizieren, Umsetzung nach Phase 2.
4. Phase 4 als Abschluss-Sprint.

Nach diesem Plan starte ich mit dem Capture der aktuellen Landing + 3 Design-Direktionen für deine Wahl.