import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section, Img, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const BASE_URL = "https://biblebot.life"

interface QRStickerEmailProps {
  churchName?: string
  slug?: string
  contactName?: string
  customBotName?: string
}

const QRStickerEmail = ({
  churchName = 'Meine Gemeinde',
  slug = 'meine-gemeinde',
  contactName,
  customBotName,
}: QRStickerEmailProps) => {
  const brandedLink = `${BASE_URL}/?church=${slug}`
  const integrationLink = `${BASE_URL}/church-integration/${slug}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(brandedLink)}&margin=12&ecc=H`
  const botName = customBotName || 'BibleBot'

  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Euer QR-Sticker für {botName} ist bereit</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {contactName ? `Hallo ${contactName}` : 'Hallo'}! 👋
          </Heading>

          <Text style={text}>
            Hier ist euer druckfertiger QR-Code für <strong>{churchName}</strong>.
            Einfach ausdrucken und in Gemeindebrief, Flyer oder Aushang einbetten —
            eure Gemeindeglieder gelangen direkt zu eurem gebrandeten {botName}.
          </Text>

          <Section style={qrSection}>
            <Text style={presentedBy}>Präsentiert von</Text>
            <Heading style={churchNameStyle}>{churchName}</Heading>
            <Hr style={divider} />
            <Img
              src={qrCodeUrl}
              alt={`QR-Code für ${churchName}`}
              width={280}
              height={280}
              style={qrImage}
            />
            <Hr style={divider} />
            <Heading style={brandName}>{SITE_NAME}</Heading>
            <Text style={tagline}>Everyday Sunday</Text>
          </Section>

          <Text style={text}>
            💡 <strong>Tipp:</strong> Druckt den QR-Code auf Aufkleber, Visitenkarten oder
            projiziert ihn auf den Beamer im Gottesdienst für eine interaktive Bibelarbeit.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={integrationLink}>
              Weitere Integrations-Optionen
            </Button>
          </Section>

          <Hr style={dividerLight} />

          <Text style={footer}>
            Mit freundlichen Grüssen,<br />
            Das {SITE_NAME} Team
          </Text>
          <Text style={footerSmall}>
            <Link href={brandedLink} style={linkStyle}>{brandedLink}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: QRStickerEmail,
  subject: (data: Record<string, any>) =>
    `Euer QR-Sticker für ${data.customBotName || 'BibleBot'} — ${data.churchName || 'eure Gemeinde'}`,
  displayName: 'QR-Sticker Versand',
  previewData: {
    churchName: 'Reformierte Kirche Zürich',
    slug: 'ref-zuerich',
    contactName: 'Pfarrer Müller',
    customBotName: 'BibelBot',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#2D2318', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }

const qrSection = {
  textAlign: 'center' as const,
  padding: '28px 20px',
  margin: '24px 0',
  backgroundColor: '#FFFDF7',
  borderRadius: '16px',
  border: '1px solid #E8DFD0',
}
const presentedBy = {
  fontSize: '13px', color: '#8B7355', margin: '0 0 4px',
  fontWeight: '300' as const, letterSpacing: '0.5px',
}
const churchNameStyle = {
  fontSize: '20px', fontWeight: '600' as const, color: '#2D2318', margin: '0 0 16px',
}
const divider = {
  borderColor: '#C8883A', borderWidth: '1px', width: '80px', margin: '16px auto',
}
const qrImage = { margin: '0 auto', borderRadius: '8px' }
const brandName = {
  fontSize: '22px', fontWeight: '700' as const, color: '#C8883A', margin: '16px 0 4px',
}
const tagline = {
  fontSize: '14px', color: '#8B7355', margin: '0',
  fontStyle: 'italic' as const, fontFamily: 'Georgia, serif',
}

const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = {
  backgroundColor: '#C8883A', color: '#ffffff', padding: '12px 28px',
  borderRadius: '8px', fontSize: '14px', fontWeight: '600' as const,
  textDecoration: 'none',
}
const dividerLight = { borderColor: '#F0EBE3', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#8B7355', lineHeight: '1.5', margin: '0 0 8px' }
const footerSmall = { fontSize: '12px', color: '#B5A896', margin: '0' }
const linkStyle = { color: '#C8883A', textDecoration: 'underline' }
