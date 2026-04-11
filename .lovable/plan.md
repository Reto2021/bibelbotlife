

# Hybrid Referral/Affiliate-System: BibleBot.Life + GHL Webhook

## Übersicht

Einfaches Referral-Tracking direkt in BibleBot.Life, kombiniert mit einem Webhook an GoHighLevel (GHL) bei Conversions (Patronats-Anfrage). Referrer erhalten einen persönlichen Code, Conversions werden getrackt und an GHL gemeldet.

## Schritt 1 — Datenbank: Referral-Tabellen

Neue Tabellen via Migration:

- **`referral_partners`** — Affiliate-Partner mit Code, Name, E-Mail, GHL-Contact-ID, Provisionsrate, Status
- **`referral_clicks`** — Klick-Tracking (ref-Code, Landing-Page, IP-Hash, Timestamp)
- **`referral_conversions`** — Conversions (Referral-Partner, Inquiry-ID, Deal-Wert, Provisions-Betrag, GHL-Webhook-Status)

RLS: Nur Admins lesen/schreiben (via `has_role`). Klick-Insert offen für anonymous (mit Validierungstrigger).

## Schritt 2 — Frontend: `?ref=CODE` Tracking

- Im `useAnalytics` Hook: `?ref=CODE` aus URL lesen, in `localStorage` speichern (30 Tage Cookie-Window)
- Klick in `referral_clicks` loggen (einmal pro Session)
- Ref-Code automatisch an `church_partnership_inquiries`-Insert in `ForChurches.tsx` anhängen (neues Feld `referral_code`)

## Schritt 3 — Edge Function: `referral-webhook`

Neue Edge Function die bei einer Conversion:
1. Referral-Partner anhand des Codes nachschlägt
2. Provision berechnet (Default: 10% des Jahresbeitrags)
3. `referral_conversions` Insert
4. **Webhook POST an GHL** mit Payload: `{ contact_id, referral_code, church_name, deal_value, commission, event: "new_conversion" }`
5. GHL-Webhook-URL aus Secrets (`GHL_WEBHOOK_URL`)

## Schritt 4 — Admin UI: Referral-Dashboard

Neuer Tab im Admin-Dashboard (`/admin`) oder eigene Seite:
- Partner-Liste (Code, Klicks, Conversions, Provision)
- Partner erstellen/bearbeiten (Name, E-Mail, Code, Provisionsrate)
- Conversion-Log mit GHL-Sync-Status
- Einfache Statistiken (Klicks → Conversions → Conversion-Rate)

## Schritt 5 — ForChurches.tsx: Referral-Code mitsenden

- Beim Submit der Partnership-Inquiry den gespeicherten Ref-Code aus localStorage mitsenden
- Nach erfolgreichem Insert: Edge Function `referral-webhook` aufrufen

## Schritt 6 — GHL Secret einrichten

- `GHL_WEBHOOK_URL` als Secret hinzufügen (via `add_secret` Tool)
- User muss die Webhook-URL aus GHL bereitstellen

## Technische Details

```text
User klickt Link (?ref=PARTNER123)
    ↓
localStorage speichert ref=PARTNER123 (30 Tage)
referral_clicks INSERT
    ↓
User füllt Patronats-Formular aus
    ↓
church_partnership_inquiries INSERT (+ referral_code)
    ↓
referral-webhook Edge Function
    ├─ referral_conversions INSERT
    └─ POST → GHL Webhook (Affiliate-Verwaltung + Auszahlung)
```

**Migration**: `referral_partners`, `referral_clicks`, `referral_conversions` + Feld `referral_code` auf `church_partnership_inquiries`

**Dateien**:
- `supabase/functions/referral-webhook/index.ts` (neu)
- `src/hooks/useAnalytics.ts` (ref-Code Tracking)
- `src/pages/ForChurches.tsx` (ref-Code mitsenden)
- `src/pages/admin/AdminDashboard.tsx` (Referral-Tab)
- DB Migration (3 Tabellen + 1 Spalte)

