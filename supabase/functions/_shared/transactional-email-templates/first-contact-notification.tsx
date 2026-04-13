import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'
const BASE_URL = 'https://biblebot.life'

interface FirstContactNotificationProps {
  churchName?: string
  senderName?: string
  senderEmail?: string
  message?: string
  slug?: string
}

const FirstContactNotificationEmail = ({
  churchName = 'Ihre Gemeinde',
  senderName,
  senderEmail,
  message,
  slug,
}: FirstContactNotificationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>🎉 Erste Kontaktanfrage für {churchName} über {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>
        <Hr style={hrGold} />

        <Heading style={h1}>🎉 Ihre erste Kontaktanfrage!</Heading>

        <Text style={text}>
          Grossartige Neuigkeiten! <strong>{churchName}</strong> hat soeben die
          erste Kontaktanfrage über {SITE_NAME} erhalten. Jemand interessiert sich
          für Ihre Gemeinde!
        </Text>

        <Section style={cardSection}>
          {senderName && (
            <>
              <Text style={label}>Name</Text>
              <Text style={value}>{senderName}</Text>
            </>
          )}
          <Text style={label}>E-Mail</Text>
          <Text style={value}>{senderEmail || '—'}</Text>
          <Hr style={hrLight} />
          <Text style={label}>Nachricht</Text>
          <Text style={messageStyle}>{message || '—'}</Text>
        </Section>

        <Text style={text}>
          Wir empfehlen, zeitnah zu antworten — der erste Eindruck zählt!
          Antworten Sie einfach direkt an die E-Mail-Adresse der Person.
        </Text>

        {slug && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button
              href={`${BASE_URL}/church-integration/${slug}`}
              style={ctaButton}
            >
              Gemeinde-Dashboard öffnen
            </Button>
          </Section>
        )}

        <Hr style={hrLight} />
        <Text style={footer}>
          Diese E-Mail wurde automatisch von {SITE_NAME} gesendet,
          weil Ihre Gemeinde als Partner registriert ist.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FirstContactNotificationEmail,
  subject: (data: Record<string, any>) =>
    `🎉 Erste Kontaktanfrage für ${data.churchName || 'Ihre Gemeinde'} – ${SITE_NAME}`,
  displayName: 'Erste Kontaktanfrage (Gemeinde)',
  previewData: {
    churchName: 'Reformierte Kirche Zürich',
    senderName: 'Maria Müller',
    senderEmail: 'maria@example.com',
    message: 'Ich würde gerne mehr über Ihre Gemeinde erfahren und nächsten Sonntag vorbeikommen.',
    slug: 'ref-zuerich',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const cardSection = { backgroundColor: '#faf6f0', borderRadius: '8px', padding: '16px 20px', margin: '16px 0' }
const label = { fontSize: '12px', color: '#999999', margin: '12px 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const value = { fontSize: '15px', color: '#1a2a3a', margin: '0 0 4px', lineHeight: '1.5' }
const messageStyle = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '4px 0 0', whiteSpace: 'pre-wrap' as const }
const hrLight = { borderColor: '#e2c496', margin: '16px 0' }
const ctaButton = { backgroundColor: '#C8883A', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
