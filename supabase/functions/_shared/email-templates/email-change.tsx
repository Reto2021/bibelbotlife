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

const i18n: Record<string, { preview: string; heading: string; body: (email: string, newEmail: string) => string; button: string; footer: string; greeting: string }> = {
  de: {
    preview: 'E-Mail-Änderung bestätigen – BibleBot.Life',
    heading: 'E-Mail-Adresse ändern',
    body: (email, newEmail) => `Du hast angefordert, deine E-Mail-Adresse von ${email} zu ${newEmail} zu ändern. Klicke auf den Button, um die Änderung zu bestätigen.`,
    button: 'Änderung bestätigen',
    footer: 'Falls du diese Änderung nicht angefordert hast, sichere bitte sofort dein Konto.',
    greeting: 'Herzliche Grüsse, dein BibleBot',
  },
  en: {
    preview: 'Confirm email change – BibleBot.Life',
    heading: 'Confirm your email change',
    body: (email, newEmail) => `You requested to change your email address from ${email} to ${newEmail}. Click the button below to confirm.`,
    button: 'Confirm Email Change',
    footer: "If you didn't request this change, please secure your account immediately.",
    greeting: 'Best regards, your BibleBot',
  },
  fr: {
    preview: "Confirmer le changement d'e-mail – BibleBot.Life",
    heading: "Confirmer le changement d'e-mail",
    body: (email, newEmail) => `Vous avez demandé à changer votre e-mail de ${email} à ${newEmail}. Cliquez ci-dessous pour confirmer.`,
    button: 'Confirmer',
    footer: "Si vous n'avez pas fait cette demande, sécurisez votre compte immédiatement.",
    greeting: 'Cordialement, votre BibleBot',
  },
  es: {
    preview: 'Confirmar cambio de correo – BibleBot.Life',
    heading: 'Confirmar cambio de correo',
    body: (email, newEmail) => `Solicitaste cambiar tu correo de ${email} a ${newEmail}. Haz clic para confirmar.`,
    button: 'Confirmar cambio',
    footer: 'Si no solicitaste este cambio, asegura tu cuenta inmediatamente.',
    greeting: 'Saludos cordiales, tu BibleBot',
  },
  it: {
    preview: 'Conferma cambio email – BibleBot.Life',
    heading: 'Conferma il cambio email',
    body: (email, newEmail) => `Hai richiesto di cambiare la tua email da ${email} a ${newEmail}. Clicca per confermare.`,
    button: 'Conferma',
    footer: 'Se non hai richiesto questo cambio, proteggi il tuo account immediatamente.',
    greeting: 'Cordiali saluti, il tuo BibleBot',
  },
  pt: {
    preview: 'Confirmar alteração de e-mail – BibleBot.Life',
    heading: 'Confirmar alteração de e-mail',
    body: (email, newEmail) => `Você solicitou alterar seu e-mail de ${email} para ${newEmail}. Clique para confirmar.`,
    button: 'Confirmar',
    footer: 'Se você não solicitou esta alteração, proteja sua conta imediatamente.',
    greeting: 'Atenciosamente, seu BibleBot',
  },
}

function getT(locale?: string) {
  const lang = (locale || 'de').slice(0, 2).toLowerCase()
  return i18n[lang] || i18n.en
}

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
  locale?: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl, locale }: EmailChangeEmailProps) => {
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
          <Text style={text}>{t.body(email || '', newEmail || '')}</Text>
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

export default EmailChangeEmail

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
