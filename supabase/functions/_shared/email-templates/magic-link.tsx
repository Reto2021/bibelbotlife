/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein Login-Link für {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={siteName} width="56" height="56" style={logoImg} />
          <Text style={brandText}>{siteName}</Text>
        </Section>
        <Hr style={hrGold} />
        <Heading style={h1}>Dein Login-Link</Heading>
        <Text style={text}>
          Klicke auf den Button, um dich bei {siteName} anzumelden. Dieser Link ist nur kurze Zeit gültig.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Jetzt anmelden
          </Button>
        </Section>
        <Hr style={hrLight} />
        <Text style={footer}>
          Falls du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = { backgroundColor: '#C8883A', color: '#ffffff', fontSize: '15px', borderRadius: '8px', padding: '12px 28px', textDecoration: 'none', fontWeight: 'bold' as const }
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
