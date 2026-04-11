import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

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
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>
        <Hr style={hrGold} />
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

        <Hr style={hrLight} />

        <Text style={label}>Nachricht</Text>
        <Text style={messageStyle}>{message || '—'}</Text>

        <Hr style={hrLight} />
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
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 24px' }
const label = { fontSize: '12px', color: '#999999', margin: '16px 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const value = { fontSize: '15px', color: '#1a2a3a', margin: '0 0 4px', lineHeight: '1.5' }
const messageStyle = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '4px 0 0', whiteSpace: 'pre-wrap' as const }
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
