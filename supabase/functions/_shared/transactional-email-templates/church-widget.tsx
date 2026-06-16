import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const BASE_URL = "https://biblebot.life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

interface Props {
  churchName?: string
  slug?: string
  contactName?: string
  customBotName?: string
  primaryColor?: string
  snippet?: string
}

const ChurchWidgetEmail = ({
  churchName = 'Eure Gemeinde',
  slug = 'meine-gemeinde',
  contactName,
  customBotName,
  primaryColor = '#C8883A',
  snippet,
}: Props) => {
  const botName = customBotName || 'BibelBot'
  const code = snippet || `<script src="${BASE_URL}/embed.js"
        data-church="${slug}"
        data-color="${primaryColor}"
        data-name="Frag ${botName}"
        data-position="bottom-right"
        data-lang="de"
        defer></script>`

  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Euer Widget-Code für {botName} ist bereit</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
            <Text style={brandTextHeader}>{SITE_NAME}</Text>
          </Section>
          <Hr style={hrGold} />

          <Heading style={h1}>
            {contactName ? `Hallo ${contactName}` : 'Hallo'}!
          </Heading>

          <Text style={text}>
            Hier ist euer persönlicher Widget-Code für <strong>{churchName}</strong>.
            Einfach den Snippet vor dem schliessenden <code>&lt;/body&gt;</code>-Tag
            in eure Website einbauen — schon erscheint ein Chat-Button unten rechts,
            der euren gebrandeten {botName} öffnet.
          </Text>

          <Section style={codeBox}>
            <pre style={pre}>{code}</pre>
          </Section>

          <Text style={text}>
            <strong>So gehts:</strong><br />
            1. Code kopieren<br />
            2. In den HTML-Code eurer Website einfügen (vor <code>&lt;/body&gt;</code>)<br />
            3. Speichern — fertig.
          </Text>

          <Section style={buttonSection}>
            <Button style={{ ...button, backgroundColor: primaryColor }} href={`${BASE_URL}/church-integration/${slug}`}>
              Weitere Integrations-Optionen
            </Button>
          </Section>

          <Hr style={dividerLight} />

          <Text style={footer}>
            Bei Fragen einfach antworten — wir helfen gerne.<br />
            Das {SITE_NAME} Team
          </Text>
          <Text style={footerSmall}>
            <Link href={`${BASE_URL}/?church=${slug}`} style={linkStyle}>{BASE_URL}/?church={slug}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ChurchWidgetEmail,
  subject: (data: Record<string, any>) =>
    `Euer Widget-Code für ${data.customBotName || 'BibelBot'} — ${data.churchName || 'eure Gemeinde'}`,
  displayName: 'Widget-Code Versand',
  previewData: {
    churchName: 'Reformierte Kirche Zürich',
    slug: 'ref-zuerich',
    contactName: 'Pfarrer Müller',
    customBotName: 'BibelBot',
    primaryColor: '#C8883A',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandTextHeader = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#2D2318', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const codeBox = {
  backgroundColor: '#1f2937',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '8px 0 24px',
  overflow: 'auto' as const,
}
const pre = {
  color: '#f3f4f6',
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: '12px',
  lineHeight: '1.5',
  whiteSpace: 'pre-wrap' as const,
  margin: 0,
}
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = {
  color: '#ffffff', padding: '12px 28px',
  borderRadius: '8px', fontSize: '14px', fontWeight: '600' as const,
  textDecoration: 'none',
}
const dividerLight = { borderColor: '#F0EBE3', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#8B7355', lineHeight: '1.5', margin: '0 0 8px' }
const footerSmall = { fontSize: '12px', color: '#B5A896', margin: '0' }
const linkStyle = { color: '#C8883A', textDecoration: 'underline' }
