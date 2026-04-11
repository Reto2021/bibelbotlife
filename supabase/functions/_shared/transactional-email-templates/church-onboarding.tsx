import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const BASE_URL = "https://biblebot.life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

interface ChurchOnboardingProps {
  churchName?: string
  slug?: string
  customBotName?: string
  contactName?: string
  planTier?: string
}

const ChurchOnboardingEmail = ({
  churchName = 'Meine Gemeinde',
  slug = 'meine-gemeinde',
  customBotName,
  contactName,
  planTier = 'community',
}: ChurchOnboardingProps) => {
  const brandedLink = `${BASE_URL}/?church=${slug}`
  const integrationPageLink = `${BASE_URL}/church-integration/${slug}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(brandedLink)}&margin=12`
  const botName = customBotName || 'BibleBot'

  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Willkommen bei {SITE_NAME} – Euer Integrations-Kit ist bereit!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
            <Text style={brandTextStyle}>{SITE_NAME}</Text>
          </Section>
          <Hr style={hrGold} />

          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerBadge}>🎉 Partnerschaft aktiviert</Text>
          </Section>

          <Heading style={h1}>
            {contactName ? `Hallo ${contactName},` : `Hallo,`}
          </Heading>

          <Text style={text}>
            Herzlich willkommen! Die Partnerschaft für <strong>{churchName}</strong> ist jetzt aktiv.
            Euer gebrandeter {botName} steht bereit und kann ab sofort von eurer Gemeinde genutzt werden.
          </Text>

          <Hr style={hrLight} />

          {/* 1. Branded Link */}
          <Heading as="h2" style={h2}>🔗 Euer Branded Link</Heading>
          <Text style={text}>
            Dieser Link führt direkt zu eurem gebrandeten BibleBot mit Splash-Screen und Kirchenlogo:
          </Text>
          <Section style={codeBlock}>
            <Text style={codeText}>{brandedLink}</Text>
          </Section>
          <Text style={hint}>
            → Ideal für Newsletter, Social Media und E-Mail-Signaturen.
          </Text>

          {/* 2. QR Code */}
          <Hr style={hrLight} />
          <Heading as="h2" style={h2}>📱 QR-Code</Heading>
          <Text style={text}>
            Druckt diesen QR-Code aus für Gemeindebrief, Flyer, Plakate oder den Beamer im Gottesdienst:
          </Text>
          <Section style={qrSection}>
            <Link href={brandedLink}>
              <img src={qrCodeUrl} alt="QR-Code" width="180" height="180" style={qrImage} />
            </Link>
          </Section>
          <Text style={hint}>
            → Scannt den Code mit dem Smartphone, um den Chat zu öffnen.
          </Text>

          {/* 3. Website Widget */}
          <Hr style={hrLight} />
          <Heading as="h2" style={h2}>💻 Website-Widget</Heading>
          <Text style={text}>
            Fügt diesen Code-Schnipsel vor dem schliessenden &lt;/body&gt; Tag eurer Website ein.
            Eure Besucher sehen einen Chat-Button unten rechts:
          </Text>
          <Section style={codeBlock}>
            <Text style={codeTextSmall}>
              &lt;script src=&quot;{`${BASE_URL}/functions/v1/church-widget?slug=${slug}`}&quot; defer&gt;&lt;/script&gt;
            </Text>
          </Section>

          {/* 4. Integrations-Seite */}
          <Hr style={hrLight} />
          <Heading as="h2" style={h2}>📋 Alles auf einen Blick</Heading>
          <Text style={text}>
            Auf eurer persönlichen Integrations-Seite findet ihr alle Assets zum Kopieren und Herunterladen —
            Link, QR-Code, Widget-Code und iFrame-Einbettung:
          </Text>
          <Section style={buttonSection}>
            <Button style={ctaButton} href={integrationPageLink}>
              Integrations-Kit öffnen
            </Button>
          </Section>

          {/* Tips */}
          <Hr style={hrLight} />
          <Heading as="h2" style={h2}>💡 Tipps für den Start</Heading>
          <Text style={listText}>• <strong>Newsletter:</strong> Branded Link + kurze Beschreibung einfügen</Text>
          <Text style={listText}>• <strong>Gemeindebrief:</strong> QR-Code ausdrucken mit Hinweis «Frag die Bibel»</Text>
          <Text style={listText}>• <strong>Website:</strong> Widget-Code einmal einbauen, fertig</Text>
          <Text style={listText}>• <strong>Gottesdienst:</strong> QR-Code auf den Beamer – interaktive Bibelarbeit</Text>
          <Text style={listText}>• <strong>Social Media:</strong> Branded Link teilen mit kurzem Teaser</Text>

          <Hr style={hrLight} />
          <Text style={footer}>
            Bei Fragen sind wir jederzeit für euch da.{'\n'}
            Herzliche Grüsse, das {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ChurchOnboardingEmail,
  subject: (data: Record<string, any>) =>
    `Willkommen ${data.churchName ? `– ${data.churchName}` : ''} | Euer BibleBot Integrations-Kit`,
  displayName: 'Gemeinde-Onboarding',
  previewData: {
    churchName: 'Vineyard Bern',
    slug: 'vineyard-bern',
    customBotName: 'ReformierterBot',
    contactName: 'Pastor Müller',
    planTier: 'community',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandTextStyle = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const headerBadge = {
  display: 'inline-block' as const,
  backgroundColor: '#f0fdf4',
  color: '#166534',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '6px 16px',
  borderRadius: '20px',
  margin: '0',
}
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '16px 0 12px' }
const h2 = { fontSize: '17px', fontWeight: '600' as const, color: '#1a2a3a', margin: '0 0 8px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const hint = { fontSize: '13px', color: '#718096', fontStyle: 'italic' as const, margin: '4px 0 0' }
const listText = { fontSize: '14px', color: '#4a5568', lineHeight: '1.5', margin: '0 0 6px' }
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0', whiteSpace: 'pre-line' as const }
const codeBlock = {
  backgroundColor: '#f7f6f3',
  border: '1px solid #e2e0dc',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '0 0 8px',
}
const codeText = { fontSize: '14px', color: '#C8883A', fontFamily: 'monospace', margin: '0', wordBreak: 'break-all' as const }
const codeTextSmall = { fontSize: '12px', color: '#C8883A', fontFamily: 'monospace', margin: '0', wordBreak: 'break-all' as const }
const qrSection = { textAlign: 'center' as const, margin: '0 0 8px' }
const qrImage = { borderRadius: '12px', border: '1px solid #e2e0dc' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0' }
const ctaButton = {
  backgroundColor: '#C8883A',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
}
