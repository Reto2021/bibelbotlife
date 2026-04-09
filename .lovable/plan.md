
# Cold Outreach Modul (Super-Admin)

Automatisiertes Lead-Gen & Sequenz-System für Gemeinde-Akquise. Nur für Admins sichtbar.

---

## 1. Datenbank-Tabellen

### `outreach_campaigns`
- `name`, `status` (active/paused/completed)
- `sender_name`, `sender_email` (Absender-Konfiguration)
- `booking_url` (Calendly/Cal.com Link für 10-Min-Demo)
- `target_criteria` (JSON: Denomination, Region, Grösse)
- RLS: Nur Admins

### `outreach_leads`
- `campaign_id`, `church_name`, `contact_name`, `email`
- `website`, `city`, `denomination`
- `scraped_data` (JSON: personalisierte Infos von der Website)
- `status` (new → contacted → replied → booked → converted → unsubscribed)
- `source` (csv_import / web_scrape)
- RLS: Nur Admins

### `outreach_sequences`
- `campaign_id`, `step_number` (1-5)
- `delay_days` (Wartezeit seit letztem Schritt)
- `subject_template`, `body_template`
- Platzhalter: {{church_name}}, {{contact_name}}, {{city}}, {{personal_note}}, {{booking_url}}

### `outreach_emails`
- `lead_id`, `sequence_step`, `sent_at`, `opened_at`, `clicked_at`
- `status` (pending/sent/opened/clicked/replied/bounced)
- Tracking für Sequenz-Fortschritt

---

## 2. Edge Functions

### `outreach-scrape` — Lead-Anreicherung
- Nimmt Website-URL entgegen
- Nutzt Firecrawl zum Scrapen
- KI (Gemini Flash) extrahiert: Pastor-Name, Kontakt-E-Mail, Gemeindegrösse, Besonderheiten
- Generiert `personal_note` basierend auf Website-Inhalten
- Speichert angereicherte Daten in `outreach_leads`

### `outreach-send` — E-Mail-Versand (Cron)
- Läuft alle 15 Minuten via pg_cron
- Prüft welche Leads den nächsten Sequenz-Schritt erhalten sollen
- Personalisiert Templates mit Lead-Daten
- Versendet via Resend (eigener Account, NICHT über Lovable E-Mail-Infra)
- Respektiert Tages-/Stundenlimits (konfigurierbar)
- Nur werktags 8-18 Uhr senden

### `outreach-import` — CSV-Import
- Nimmt CSV mit Gemeinde-Daten entgegen
- Parsed und validiert
- Optional: automatisches Anreichern via Scraping

---

## 3. Admin-UI (unter /admin/outreach)

### Kampagnen-Übersicht
- Liste aktiver Kampagnen mit KPIs (Leads, Gesendet, Geöffnet, Gebucht)
- Kampagne starten/pausieren/stoppen

### Kampagnen-Editor
- Absender konfigurieren
- Zielgruppe definieren (Region, Konfession)
- Buchungslink hinterlegen
- Sequenz-Schritte bearbeiten (Subject + Body mit Platzhaltern)
- Zeitliche Abstände zwischen Schritten

### Lead-Management
- Tabelle mit allen Leads + Status
- CSV-Import Button
- "Scrape & Anreichern" für einzelne Leads
- Lead-Details mit Sequenz-Verlauf

### Einstellungen
- Max. E-Mails pro Tag / pro Stunde
- Sendezeiten (Werktags, Uhrzeiten)
- Blacklist-Domains

---

## 4. Technische Übersicht

| # | Komponente | Beschreibung |
|---|---|---|
| 1 | 4 DB-Tabellen | Campaigns, Leads, Sequences, Emails |
| 2 | 3 Edge Functions | Scrape, Send (Cron), Import |
| 3 | Admin-UI | Kampagnen, Leads, Sequenzen, Stats |
| 4 | Firecrawl | Website-Scraping für Lead-Anreicherung |
| 5 | Resend | E-Mail-Versand (eigener Account) |
| 6 | Lovable AI | Personalisierung der E-Mails |

**Voraussetzungen:**
- Firecrawl Connector für Web-Scraping
- Resend API Key (bereits vorhanden)
- Separater Resend-Account mit eigener Domain für Cold Outreach
