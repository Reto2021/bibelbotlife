
# PDF-Rechnungssystem

## Übersicht
Gemeinde-Admins können PDF-Rechnungen generieren, herunterladen und optional per E-Mail versenden. Automatische Rechnungserstellung basierend auf `billing_interval`.

---

## 1. Rechnungstabelle (`invoices`)

Neue Tabelle zur Verwaltung aller Rechnungen:
- `church_id` → Referenz auf `church_partners`
- `invoice_number` → Fortlaufende Rechnungsnummer (z.B. INV-2026-001)
- `invoice_date`, `due_date`
- `amount`, `currency` (CHF)
- `status` (draft, sent, paid)
- `line_items` (JSON: Beschreibung, Menge, Preis)
- `pdf_url` → Link zur gespeicherten PDF in Storage
- RLS: Nur Admin und Church-Owner können lesen/erstellen

---

## 2. Fixe Absenderdaten

Konfiguration im Admin-Dashboard oder als Konstanten:
- Firmenname, Adresse, IBAN, UID, Kontakt
- Werden auf jeder Rechnung als Absender gedruckt

---

## 3. PDF-Generierung (Edge Function)

Edge Function `generate-invoice`:
- Nimmt `church_id` + `line_items` entgegen
- Holt Rechnungsadresse aus `church_partners` (billing_name, billing_street etc.)
- Generiert PDF mit:
  - Absender (fix)
  - Empfänger (aus church_partners)
  - Rechnungspositionen
  - IBAN + QR-Zahlungsteil (Schweizer Standard)
  - Rechnungsnummer + Datum
- Speichert PDF in Supabase Storage
- Gibt `pdf_url` zurück

---

## 4. Dashboard-UI

Neuer Tab "Rechnungen" in den Einstellungen oder eigene Seite:
- Liste aller Rechnungen mit Status
- Button "Neue Rechnung erstellen"
- Dialog mit Positionen (Beschreibung, Betrag)
- Vorschau → PDF generieren → Download
- Optional: "Per E-Mail senden" Button

---

## 5. Automatische Rechnungen (Phase 2)

Cron-Job prüft monatlich/jährlich:
- Welche Gemeinden sind fällig (basierend auf `billing_interval` + `subscription_started_at`)
- Erstellt automatisch Rechnung mit Standardpositionen je Tier
- Setzt Status auf "draft" zur Überprüfung

---

## 6. E-Mail-Versand (optional)

Nutzt bestehendes Transaktions-E-Mail-System:
- Neues Template `invoice-notification`
- Enthält Download-Link zur PDF (kein Attachment)
- Wird an `billing_email` der Gemeinde gesendet
