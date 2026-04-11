import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"

interface ContactNotificationProps {
  senderName?: string
  senderEmail?: string
  organizationType?: string
  churchName?: string
  message?: string
  source?: string
}

const ContactNotificationEmail = ({
  senderName, senderEmail, organizationType, churchName, message, source,
}: ContactNotificationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Neue Kontaktanfrage über {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Neue Kontaktanfrage</Heading>
        <Text style={label}>Quelle</Text>
        <Text style={value}>{source || 'Webformular'}</Text>

        {senderName && (
          <>
            <Text style={label}>Name</Text>
            <Text style={value}>{senderName}</Text>
          </>
        )}

        <Text style={label}>E-Mail</Text>
        <Text style={value}>{senderEmail || '—'}</Text>

        {organizationType && (
          <>
            <Text style={label}>Organisationstyp</Text>
            <Text style={value}>{organizationType}</Text>
          </>
        )}

        {churchName && (
          <>
            <Text style={label}>Organisation</Text>
            <Text style={value}>{churchName}</Text>
          </>
        )}

        <Hr style={hr} />

        <Text style={label}>Nachricht</Text>
        <Text style={messageStyle}>{message || '—'}</Text>

        <Hr style={hr} />
        <Text style={footer}>
          Diese E-Mail wurde automatisch von {SITE_NAME} generiert.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Neue Anfrage: ${data.senderName || data.senderEmail || 'Unbekannt'} – ${SITE_NAME}`,
  displayName: 'Kontaktanfrage-Benachrichtigung (Admin)',
  previewData: {
    senderName: 'Maria Müller',
    senderEmail: 'maria@example.com',
    organizationType: 'Gemeinde',
    churchName: 'Reformierte Kirche Zürich',
    message: 'Wir interessieren uns für eine Partnerschaft mit BibleBot.Life.',
    source: 'Gemeinde-Seite',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 24px' }
const label = { fontSize: '12px', color: '#999999', margin: '16px 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const value = { fontSize: '15px', color: '#1a2a3a', margin: '0 0 4px', lineHeight: '1.5' }
const messageStyle = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '4px 0 0', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
