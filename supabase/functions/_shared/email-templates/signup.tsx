/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>E-Mail bestätigen – {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Willkommen bei {siteName}! ✨</Heading>
        <Text style={text}>
          Schön, dass du dabei bist! Bitte bestätige deine E-Mail-Adresse (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ), um loszulegen:
        </Text>
        <Button style={button} href={confirmationUrl}>
          E-Mail bestätigen
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Falls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(32, 65%, 52%)', color: '#ffffff', fontSize: '15px', borderRadius: '0.5rem', padding: '12px 24px', textDecoration: 'none', fontWeight: 'bold' as const }
const hr = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
