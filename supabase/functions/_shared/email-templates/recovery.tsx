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
    preview: 'Passwort zurücksetzen – BibleBot.Life',
    heading: 'Passwort zurücksetzen',
    body: 'Wir haben eine Anfrage erhalten, dein Passwort bei BibleBot.Life zurückzusetzen. Klicke auf den Button, um ein neues Passwort zu wählen.',
    button: 'Passwort zurücksetzen',
    footer: 'Falls du kein Passwort-Reset angefordert hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.',
    greeting: 'Herzliche Grüsse, dein BibleBot',
  },
  en: {
    preview: 'Reset your password – BibleBot.Life',
    heading: 'Reset your password',
    body: 'We received a request to reset your password for BibleBot.Life. Click the button below to choose a new password.',
    button: 'Reset Password',
    footer: "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.",
    greeting: 'Best regards, your BibleBot',
  },
  fr: {
    preview: 'Réinitialiser votre mot de passe – BibleBot.Life',
    heading: 'Réinitialiser votre mot de passe',
    body: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous.',
    button: 'Réinitialiser',
    footer: "Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.",
    greeting: 'Cordialement, votre BibleBot',
  },
  es: {
    preview: 'Restablecer contraseña – BibleBot.Life',
    heading: 'Restablecer contraseña',
    body: 'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo.',
    button: 'Restablecer',
    footer: 'Si no solicitaste esto, puedes ignorar este correo.',
    greeting: 'Saludos cordiales, tu BibleBot',
  },
  it: {
    preview: 'Reimposta la password – BibleBot.Life',
    heading: 'Reimposta la password',
    body: 'Abbiamo ricevuto una richiesta di reimpostazione della password. Clicca il pulsante qui sotto.',
    button: 'Reimposta',
    footer: 'Se non hai richiesto questo, ignora questa email.',
    greeting: 'Cordiali saluti, il tuo BibleBot',
  },
  pt: {
    preview: 'Redefinir senha – BibleBot.Life',
    heading: 'Redefinir senha',
    body: 'Recebemos um pedido para redefinir sua senha. Clique no botão abaixo.',
    button: 'Redefinir',
    footer: 'Se você não solicitou isso, ignore este e-mail.',
    greeting: 'Atenciosamente, seu BibleBot',
  },
}

function getT(locale?: string) {
  const lang = (locale || 'de').slice(0, 2).toLowerCase()
  return i18n[lang] || i18n.en
}

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  locale?: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl, locale }: RecoveryEmailProps) => {
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

export default RecoveryEmail

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
