---
name: Prospecting Branding Flow
description: Firecrawl branding extraction, widget preview with A/B testing, splash QR page, score-based email sequences
type: feature
---
## Routen
- `/widget-preview/:leadId` — Interaktives Chat-Widget mit Lead-Branding, A/B-Farbvarianten-Toggle
- `/splash/:churchSlug` — Druckbare QR-Code-Seite für Print-Materialien

## DB-Erweiterungen
- `outreach_leads` erweitert: scraped_branding, website_score, primary_color, secondary_color, text_color, logo_url, screenshot_url, ab_variant_color, ab_variant_chosen
- `ab_test_events` Tabelle: lead_id, variant (original/alternative), event_type (view/click/cta_click)

## Edge Functions
- `outreach-scrape` — Firecrawl branding+screenshot+markdown → AI contact extraction + website score (1-10) + A/B-Farbvariante (+15° Hue Shift)
- `outreach-send` — Erweiterte Platzhalter: {{previewUrl}}, {{screenshotUrl}}, {{splashUrl}}, {{websiteScore}}, {{primaryColor}}, {{logoUrl}}

## Admin
- OutreachAdmin: Leads-Tabelle mit Farbpunkten, Score-Badge, Widget-Preview-Link
- A/B-Test Tab: Conversion-Rate-Vergleich Original vs. Alternative
- Dependency: react-qr-code
