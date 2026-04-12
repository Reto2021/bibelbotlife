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
    preview: 'Du wurdest zu BibleBot.Life eingeladen',
    heading: 'Du wurdest eingeladen 💛',
    body: 'Du wurdest eingeladen, BibleBot.Life beizutreten. Klicke auf den Button, um die Einladung anzunehmen und dein Konto zu erstellen.',
    button: 'Einladung annehmen',
    footer: 'Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.',
    greeting: 'Herzliche Grüsse, dein BibleBot',
  },
  en: {
    preview: "You've been invited to BibleBot.Life",
    heading: "You've been invited 💛",
    body: "You've been invited to join BibleBot.Life. Click the button below to accept the invitation and create your account.",
    button: 'Accept Invitation',
    footer: "If you weren't expecting this invitation, you can safely ignore this email.",
    greeting: 'Best regards, your BibleBot',
  },
  fr: {
    preview: 'Vous avez été invité sur BibleBot.Life',
    heading: 'Vous êtes invité 💛',
    body: 'Vous avez été invité à rejoindre BibleBot.Life. Cliquez ci-dessous pour accepter.',
    button: 'Accepter',
    footer: "Si vous n'attendiez pas cette invitation, ignorez cet e-mail.",
    greeting: 'Cordialement, votre BibleBot',
  },
  es: {
    preview: 'Has sido invitado a BibleBot.Life',
    heading: 'Has sido invitado 💛',
    body: 'Has sido invitado a unirte a BibleBot.Life. Haz clic en el botón para aceptar.',
    button: 'Aceptar invitación',
    footer: 'Si no esperabas esta invitación, ignora este correo.',
    greeting: 'Saludos cordiales, tu BibleBot',
  },
  it: {
    preview: 'Sei stato invitato su BibleBot.Life',
    heading: 'Sei stato invitato 💛',
    body: 'Sei stato invitato a unirti a BibleBot.Life. Clicca il pulsante per accettare.',
    button: 'Accetta',
    footer: 'Se non ti aspettavi questo invito, ignora questa email.',
    greeting: 'Cordiali saluti, il tuo BibleBot',
  },
  pt: {
    preview: 'Você foi convidado para o BibleBot.Life',
    heading: 'Você foi convidado 💛',
    body: 'Você foi convidado para participar do BibleBot.Life. Clique no botão para aceitar.',
    button: 'Aceitar convite',
    footer: 'Se você não esperava este convite, ignore este e-mail.',
    greeting: 'Atenciosamente, seu BibleBot',
  },
}

function getT(locale?: string) {
  const lang = (locale || 'de').slice(0, 2).toLowerCase()
  return i18n[lang] || i18n.en
}

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  locale?: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl, locale }: InviteEmailProps) => {
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

export default InviteEmail

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
