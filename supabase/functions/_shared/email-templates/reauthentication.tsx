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

const i18n: Record<string, { preview: string; heading: string; body: string; footer: string; greeting: string }> = {
  de: {
    preview: 'Dein Bestätigungscode – BibleBot.Life',
    heading: 'Bestätigungscode',
    body: 'Verwende den folgenden Code, um deine Identität zu bestätigen:',
    footer: 'Dieser Code läuft in Kürze ab. Falls du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.',
    greeting: 'Herzliche Grüsse, dein BibleBot',
  },
  en: {
    preview: 'Your verification code – BibleBot.Life',
    heading: 'Verification code',
    body: 'Use the code below to confirm your identity:',
    footer: "This code will expire shortly. If you didn't request this, you can safely ignore this email.",
    greeting: 'Best regards, your BibleBot',
  },
  fr: {
    preview: 'Votre code de vérification – BibleBot.Life',
    heading: 'Code de vérification',
    body: 'Utilisez le code ci-dessous pour confirmer votre identité :',
    footer: "Ce code expirera bientôt. Si vous ne l'avez pas demandé, ignorez cet e-mail.",
    greeting: 'Cordialement, votre BibleBot',
  },
  es: {
    preview: 'Tu código de verificación – BibleBot.Life',
    heading: 'Código de verificación',
    body: 'Usa el código de abajo para confirmar tu identidad:',
    footer: 'Este código expirará pronto. Si no lo solicitaste, ignora este correo.',
    greeting: 'Saludos cordiales, tu BibleBot',
  },
  it: {
    preview: 'Il tuo codice di verifica – BibleBot.Life',
    heading: 'Codice di verifica',
    body: 'Usa il codice qui sotto per confermare la tua identità:',
    footer: 'Questo codice scadrà a breve. Se non lo hai richiesto, ignora questa email.',
    greeting: 'Cordiali saluti, il tuo BibleBot',
  },
  pt: {
    preview: 'Seu código de verificação – BibleBot.Life',
    heading: 'Código de verificação',
    body: 'Use o código abaixo para confirmar sua identidade:',
    footer: 'Este código expirará em breve. Se você não solicitou, ignore este e-mail.',
    greeting: 'Atenciosamente, seu BibleBot',
  },
}

function getT(locale?: string) {
  const lang = (locale || 'de').slice(0, 2).toLowerCase()
  return i18n[lang] || i18n.en
}

interface ReauthenticationEmailProps {
  token: string
  locale?: string
}

export const ReauthenticationEmail = ({ token, locale }: ReauthenticationEmailProps) => {
  const t = getT(locale)
  return (
    <Html lang={(locale || 'de').slice(0, 2)} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt="BibleBot.Life" width="56" height="56" style={logoImg} />
            <Text style={brandText}>BibleBot.Life</Text>
          </Section>
          <Hr style={hrGold} />
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={text}>{t.body}</Text>
          <Text style={codeStyle}>{token}</Text>
          <Hr style={hrLight} />
          <Text style={footer}>{t.footer}</Text>
          <Text style={greetingStyle}>{t.greeting}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px', textAlign: 'center' as const }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#C8883A',
  margin: '0 0 24px',
  letterSpacing: '4px',
  textAlign: 'center' as const,
  backgroundColor: '#fdf6ec',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #e2c496',
}
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 8px' }
const greetingStyle = { fontSize: '13px', color: '#999999', margin: '0' }
