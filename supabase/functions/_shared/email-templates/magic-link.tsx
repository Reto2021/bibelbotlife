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

const i18n: Record<string, { preview: string; heading: string; body: string; button: string; footer: string; greeting: string }> = {
  de: {
    preview: 'Dein Login-Link für BibleBot.Life',
    heading: 'Dein Login-Link',
    body: 'Klicke auf den Button, um dich bei BibleBot.Life einzuloggen. Der Link ist nur kurze Zeit gültig.',
    button: 'Jetzt einloggen',
    footer: 'Falls du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.',
    greeting: 'Herzliche Grüsse, dein BibleBot',
  },
  en: {
    preview: 'Your login link for BibleBot.Life',
    heading: 'Your login link',
    body: 'Click the button below to log in to BibleBot.Life. This link will expire shortly.',
    button: 'Log In',
    footer: "If you didn't request this link, you can safely ignore this email.",
    greeting: 'Best regards, your BibleBot',
  },
  fr: {
    preview: 'Votre lien de connexion pour BibleBot.Life',
    heading: 'Votre lien de connexion',
    body: 'Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expirera bientôt.',
    button: 'Se connecter',
    footer: "Si vous n'avez pas demandé ce lien, ignorez cet e-mail.",
    greeting: 'Cordialement, votre BibleBot',
  },
  es: {
    preview: 'Tu enlace de inicio de sesión – BibleBot.Life',
    heading: 'Tu enlace de inicio de sesión',
    body: 'Haz clic en el botón para iniciar sesión. Este enlace expirará pronto.',
    button: 'Iniciar sesión',
    footer: 'Si no solicitaste este enlace, ignora este correo.',
    greeting: 'Saludos cordiales, tu BibleBot',
  },
  it: {
    preview: 'Il tuo link di accesso – BibleBot.Life',
    heading: 'Il tuo link di accesso',
    body: 'Clicca il pulsante qui sotto per accedere. Questo link scadrà a breve.',
    button: 'Accedi',
    footer: 'Se non hai richiesto questo link, ignora questa email.',
    greeting: 'Cordiali saluti, il tuo BibleBot',
  },
  pt: {
    preview: 'Seu link de login – BibleBot.Life',
    heading: 'Seu link de login',
    body: 'Clique no botão abaixo para fazer login. Este link expirará em breve.',
    button: 'Entrar',
    footer: 'Se você não solicitou este link, ignore este e-mail.',
    greeting: 'Atenciosamente, seu BibleBot',
  },
}

function getT(locale?: string) {
  const lang = (locale || 'de').slice(0, 2).toLowerCase()
  return i18n[lang] || i18n.en
}

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  locale?: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl, locale }: MagicLinkEmailProps) => {
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
          <Button style={button} href={confirmationUrl}>
            {t.button}
          </Button>
          <Hr style={hrLight} />
          <Text style={footer}>{t.footer}</Text>
          <Text style={greetingStyle}>{t.greeting}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px', textAlign: 'center' as const }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#C8883A', color: '#ffffff', fontSize: '15px', borderRadius: '8px', padding: '14px 24px', textDecoration: 'none', fontWeight: '600' as const }
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 8px' }
const greetingStyle = { fontSize: '13px', color: '#999999', margin: '0' }
