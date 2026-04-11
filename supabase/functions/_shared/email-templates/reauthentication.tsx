/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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
const SITE_NAME = 'BibleBot.Life'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein Bestätigungscode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>
        <Hr style={hrGold} />
        <Heading style={h1}>Identität bestätigen</Heading>
        <Text style={text}>Verwende diesen Code, um deine Identität zu bestätigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hrLight} />
        <Text style={footer}>
          Dieser Code ist nur kurze Zeit gültig. Falls du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#C8883A', margin: '0 0 24px', letterSpacing: '4px', textAlign: 'center' as const }
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
