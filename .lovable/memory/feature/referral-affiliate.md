---
name: Referral/Affiliate-System
description: Hybrid Referral-Tracking (?ref=CODE) + GHL-Webhook bei Patronats-Conversions
type: feature
---
## Ablauf
1. User klickt `?ref=CODE` → localStorage (30-Tage-Fenster) + `referral_clicks` INSERT
2. User füllt Patronats-Formular → `church_partnership_inquiries` INSERT (mit `referral_code`)
3. Edge Function `referral-webhook` → `referral_conversions` INSERT + POST an GHL

## DB-Tabellen
- `referral_partners` — code, name, email, ghl_contact_id, commission_rate, totals
- `referral_clicks` — referral_code, landing_page, session_id (public INSERT)
- `referral_conversions` — partner_id, inquiry_id, deal_value, commission_amount, ghl_webhook_status
- `church_partnership_inquiries.referral_code` — neue Spalte

## Secrets
- `GHL_WEBHOOK_URL` — GoHighLevel Webhook für Conversion-Events

## Admin UI
- `/admin/referrals` — Partner-Verwaltung, Klick/Conversion-Stats, GHL-Sync-Status

## Code
- `src/hooks/useAnalytics.ts` — `captureReferral()`, `getStoredReferralCode()`
- `src/pages/ForChurches.tsx` — Referral-Code mitsenden + Webhook aufrufen
- `src/pages/admin/ReferralAdmin.tsx` — Admin-Dashboard
- `supabase/functions/referral-webhook/index.ts` — Conversion-Logik + GHL POST
