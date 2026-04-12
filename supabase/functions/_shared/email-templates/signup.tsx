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

const i18n: Record<string, { preview: string; heading: string; thanks: string; confirm: string; button: string; footer: string; greeting: string }> = {
  de: {
    preview: 'Bestätige deine E-Mail-Adresse für BibleBot.Life',
    heading: 'Willkommen bei BibleBot.Life 💛',
    thanks: 'Schön, dass du dabei bist!',
    confirm: 'Bitte bestätige deine E-Mail-Adresse, indem du auf den Button klickst:',
    button: 'E-Mail bestätigen',
    footer: 'Falls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.',
    greeting: 'Herzliche Grüsse, dein BibleBot',
  },
  en: {
    preview: 'Confirm your email for BibleBot.Life',
    heading: 'Welcome to BibleBot.Life 💛',
    thanks: 'Great to have you!',
    confirm: 'Please confirm your email address by clicking the button below:',
    button: 'Verify Email',
    footer: "If you didn't create an account, you can safely ignore this email.",
    greeting: 'Best regards, your BibleBot',
  },
  fr: {
    preview: 'Confirmez votre e-mail pour BibleBot.Life',
    heading: 'Bienvenue sur BibleBot.Life 💛',
    thanks: 'Ravi de vous compter parmi nous !',
    confirm: 'Veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :',
    button: "Confirmer l'e-mail",
    footer: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet e-mail.",
    greeting: 'Cordialement, votre BibleBot',
  },
  es: {
    preview: 'Confirma tu correo para BibleBot.Life',
    heading: 'Bienvenido a BibleBot.Life 💛',
    thanks: '¡Qué bueno tenerte aquí!',
    confirm: 'Por favor confirma tu dirección de correo haciendo clic en el botón:',
    button: 'Verificar correo',
    footer: 'Si no creaste una cuenta, puedes ignorar este correo.',
    greeting: 'Saludos cordiales, tu BibleBot',
  },
  it: {
    preview: 'Conferma la tua email per BibleBot.Life',
    heading: 'Benvenuto su BibleBot.Life 💛',
    thanks: 'Bello averti con noi!',
    confirm: 'Conferma il tuo indirizzo email cliccando il pulsante qui sotto:',
    button: 'Conferma email',
    footer: 'Se non hai creato un account, puoi ignorare questa email.',
    greeting: 'Cordiali saluti, il tuo BibleBot',
  },
  pt: {
    preview: 'Confirme seu e-mail para BibleBot.Life',
    heading: 'Bem-vindo ao BibleBot.Life 💛',
    thanks: 'Que bom ter você conosco!',
    confirm: 'Confirme seu endereço de e-mail clicando no botão abaixo:',
    button: 'Confirmar e-mail',
    footer: 'Se você não criou uma conta, pode ignorar este e-mail.',
    greeting: 'Atenciosamente, seu BibleBot',
  },
}

function getT(locale?: string) {
  const lang = (locale || 'de').slice(0, 2).toLowerCase()
  return i18n[lang] || i18n.en
}

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  locale?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  locale,
}: SignupEmailProps) => {
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
          <Text style={text}>{t.thanks}</Text>
          <Text style={text}>{t.confirm}</Text>
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

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px', textAlign: 'center' as const }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#C8883A',
  color: '#ffffff',
  fontSize: '15px',
  borderRadius: '8px',
  padding: '14px 24px',
  textDecoration: 'none',
  fontWeight: '600' as const,
  display: 'inline-block' as const,
}
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 8px' }
const greetingStyle = { fontSize: '13px', color: '#999999', margin: '0' }
