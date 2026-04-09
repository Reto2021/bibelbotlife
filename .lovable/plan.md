

# Collaboration, File-Sharing & Email-Einladungen für BibleBot

## Aktueller Stand

**Was bereits existiert:**
- **Team-Verwaltung** (`TeamPage`): Mitglieder können mit Name, E-Mail, Rolle und Verfügbarkeit erfasst werden — aber rein als Datenbank-Einträge, ohne Einladungs-E-Mails oder Login-Zugang
- **SharedDraft**: Zeremonien-Entwürfe (Trauerreden etc.) können via Token-Link geteilt werden — ohne Login nötig
- **Transaktionale E-Mails**: Infrastruktur steht (Queue, Templates für Kontakt-Bestätigung, Church-Onboarding, Rechnungs-Benachrichtigung)
- **Invite-E-Mail-Template** existiert bereits als Auth-Template (`_shared/email-templates/invite.tsx`), wird aber nicht für Team-Einladungen genutzt
- **PDF-Export**: Gottesdienstablauf kann als PDF exportiert werden
- **Keine Dateianhänge** in E-Mails möglich (Lovable-Einschränkung) — aber Download-Links sind möglich

## Vorgeschlagene Features

### 1. Team-Einladung per E-Mail
Wenn ein neues Teammitglied im Dashboard erfasst wird und eine E-Mail-Adresse hat, wird automatisch eine Einladungs-E-Mail versendet.

- Neues transaktionales E-Mail-Template `team-invitation` erstellen
- Beim Erstellen eines Teammitglieds `send-transactional-email` aufrufen
- E-Mail enthält: Gemeindename, Rolle, Link zum Dashboard/Login
- Registry in `registry.ts` erweitern

### 2. Gottesdienst-Ablauf per E-Mail teilen
Button im ServiceEditor neben dem PDF-Button: "Per E-Mail senden". Öffnet ein kleines Dialog-Formular mit Empfänger-E-Mail.

- PDF wird in Supabase Storage (`share-images` oder neuer Bucket) hochgeladen
- Neues Template `service-share` mit Download-Link zum PDF
- Empfänger erhält E-Mail mit Gottesdienstdetails und PDF-Download-Link

### 3. Gottesdienst-Ablauf mit Team teilen
Ein "An Team senden"-Button, der den Ablauf an alle Team-Mitglieder mit E-Mail-Adresse sendet.

- Iteriert über aktive Teammitglieder mit E-Mail
- Sendet individuelle E-Mails (je eine pro Mitglied, kein Bulk)
- Verwendet dasselbe `service-share` Template

## Technische Umsetzung

### Schritt 1: E-Mail-Template `team-invitation`
- Datei: `supabase/functions/_shared/transactional-email-templates/team-invitation.tsx`
- Props: `churchName`, `role`, `inviterName`, `dashboardUrl`
- Betreff: "Einladung zum Team von [Gemeinde]"

### Schritt 2: E-Mail-Template `service-share`
- Datei: `supabase/functions/_shared/transactional-email-templates/service-share.tsx`
- Props: `serviceTitle`, `serviceDate`, `churchName`, `downloadUrl`
- Betreff: "Gottesdienstablauf: [Titel]"

### Schritt 3: Registry aktualisieren
- Beide Templates in `registry.ts` registrieren

### Schritt 4: TeamPage erweitern
- Nach `createMember` → `supabase.functions.invoke('send-transactional-email', ...)` aufrufen
- Toast-Nachricht: "Einladung gesendet"

### Schritt 5: ServiceEditor erweitern
- "E-Mail senden"-Button und Dialog hinzufügen
- PDF generieren → in Storage hochladen → Signed URL erstellen → E-Mail senden
- Optional: "An Team senden"-Button

### Schritt 6: Deploy
- `deploy_edge_functions` für `send-transactional-email`

## Einschränkungen
- **Keine Dateianhänge**: PDFs werden als Download-Link in der E-Mail versendet (via Supabase Storage signed URL)
- **Kein Echtzeit-Collaboration** (wie Google Docs): Nur Teilen von fertigen Dokumenten
- **Jede E-Mail geht an genau einen Empfänger** (einzeln getriggert pro Teammitglied)

