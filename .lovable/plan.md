# Plan: Hero-Test + "Bible in your Life"

Zwei parallele Stränge: (A) Hero-Hook messbar testen, (B) neues Feature-Bundle "Bible in your Life" — importierbares KI-Gedächtnis + kontextbezogene Bibel-Pushes.

---

## A. Hero A/B-Test (leichtgewichtig, ohne externes Tool)

**Ziel:** Statt Bauchgefühl echte Klick-Daten für den Hero-Claim.

**Varianten (rotieren pro Visitor, gespeichert in `localStorage`):**
1. `präsenz` — aktuell: "Präsenz & Weisheit für deinen Weg."
2. `begleiter` — konkret: "Dein persönlicher Bibel-Begleiter. Frag alles. Anonym."
3. `leben` — neue Positionierung: "Die Bibel in deinem Leben. Jeden Tag."

**Technisch:**
- `src/lib/hero-variant.ts` — deterministische Zuweisung (Hash von Visitor-ID), persistent
- `src/components/ChatHero.tsx` — liest Variante, rendert entsprechenden Text (aus i18n)
- `analytics_events` bereits vorhanden → Event `hero_variant_view` + `hero_variant_cta_click` mit `variant` in `event_data`
- Auswertung: neuer Tab in `/admin/analytics` (Conversion Rate pro Variante = CTA-Klicks / Views)
- Alle 3 i18n-Strings zusätzlich in `de.json` + `en.json` (Rest erbt DE als Fallback)

---

## B. "Bible in your Life" — Feature-Bundle

Drei zusammenhängende Bausteine, alle unter `/mein-bereich`.

### B1. KI-Gedächtnis Import (`.md` aus GPT/Claude/Gemini)

**Nutzer-Flow:** In ChatGPT/Claude/Gemini gibt es exportierbares "Memory"/"Projects"-Wissen. Nutzer lädt `.md` hoch → wir extrahieren Fakten → Chat nutzt sie.

**Umsetzung:**
- Neue Tabelle `user_memory` (`user_id`, `content` text, `source` enum: `gpt`/`claude`/`gemini`/`manual`, `imported_at`, `is_active`) mit RLS + GRANT
- Neue Seite `/mein-bereich/gedaechtnis` — File-Upload (`.md` bis 100 KB), Textarea zum manuellen Bearbeiten, Toggle "aktiv"
- Edge Function `memory-import` (`verify_jwt = true`) — parst Markdown, extrahiert Bullet-Fakten via `openai/gpt-5-mini`, speichert als bereinigten Text
- `bibelbot-chat` Edge Function: lädt aktives Memory des Users (falls eingeloggt) und hängt es als System-Prompt-Block "Was ich über dich weiss" an
- Datenschutz: klare UI-Copy "Nur du siehst das. Wird nur zum Personalisieren deiner Antworten genutzt. Jederzeit löschbar."

### B2. Prompt/Chat Export & Import

**Nutzer-Flow:** Bestehende Chat-Historie als `.md` runterladen (portabel für andere KIs) und umgekehrt Prompts als `.md` importieren.

**Umsetzung:**
- `src/pages/mein-bereich/GedaechtnisPage.tsx` bekommt zwei Buttons:
  - "Chats exportieren" — lädt alle `chat_conversations` + `chat_messages` des Users, generiert `.md` client-seitig (Titel, Datum, User/Assistant-Blöcke)
  - "Prompt importieren" — `.md`-Upload, öffnet neuen Chat mit vorbelegtem System-Kontext
- Kein Backend nötig für Export (Client-only); Import nutzt `sessionStorage` → `BibelBotChat` liest beim Mount

### B3. Kontextbezogene Bibel-Pushes (Erweiterung Bible Moments)

Bestehende `bible_moments`-Infrastruktur nutzen — nur neue Trigger-Typen.

**Neue Trigger im bestehenden Enum:**
- `calendar` — Kalender-Events (User trägt manuell ein: "Prüfung am 15.", "Beerdigung Mutter")
- `journal_mood` — automatisch: wenn im Journal negative Stimmung erkannt wird, folgt am nächsten Morgen ein passender Vers
- `memory_topic` — nutzt B1: wenn Memory ein Thema erwähnt ("Job-Verlust"), sendet passende Verse

**Umsetzung:**
- Migration: Enum-Erweiterung `ALTER TYPE bible_moment_trigger ADD VALUE ...` (3 neue Werte)
- `bible-moment-dispatch` Edge Function: neuer Branch pro Trigger, für `memory_topic` liest sie `user_memory` und generiert Themen-passenden Vers via `openai/gpt-5-mini`
- `BibleMoments.tsx`: UI-Cards für die 3 neuen Trigger

---

## Reihenfolge

1. **Hero A/B-Test** (klein, sofortiger Lern-Effekt) — ~30 Min
2. **B1 Memory-Import** (grösster Impact, Alleinstellungsmerkmal) — Migration + Seite + Chat-Integration
3. **B2 Export/Import Prompts** — reines Frontend, schnell
4. **B3 Kontext-Pushes** — Enum-Erweiterung + Dispatcher-Branches

## Technische Details

**Datenbank-Migration (B1):**
```sql
CREATE TABLE public.user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) <= 20000),
  source text NOT NULL CHECK (source IN ('gpt','claude','gemini','manual')),
  is_active boolean NOT NULL DEFAULT true,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory TO authenticated;
GRANT ALL ON public.user_memory TO service_role;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_memory" ON public.user_memory FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**Modell-Wahl:** `openai/gpt-5-mini` (priority) für Memory-Parsing und Themen-Matching — schnell, günstig, gut genug für Extraction. Chat selbst bleibt auf `gpt-5.5`.

**Datenschutz:** Memory-Content wird nie geloggt, nie in Analytics, nie in Outreach. Löschung = harter Delete.

---

Bestätigst du die Reihenfolge, oder soll ein Teil vorgezogen/gestrichen werden?
