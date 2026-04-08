import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"

interface ContactConfirmationProps {
  name?: string
}

const ContactConfirmationEmail = ({ name }: ContactConfirmationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Danke für Ihre Nachricht an {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Vielen Dank, ${name}!` : 'Vielen Dank für Ihre Nachricht!'}
        </Heading>
        <Text style={text}>
          Wir haben Ihre Anfrage erhalten und melden uns so schnell wie möglich bei Ihnen.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Herzliche Grüsse, das {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Danke für Ihre Anfrage – BibleBot.Life',
  displayName: 'Kontaktformular-Bestätigung',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const hr = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
