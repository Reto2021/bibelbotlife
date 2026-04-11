import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

interface TeamInvitationProps {
  churchName?: string
  role?: string
  inviterName?: string
  dashboardUrl?: string
}

const ROLE_LABELS: Record<string, string> = {
  pastor: 'Pfarrer/in',
  musician: 'Musiker/in',
  lector: 'Lektor/in',
  sacristan: 'Sakristan/in',
  technician: 'Techniker/in',
  volunteer: 'Freiwillige/r',
  other: 'Teammitglied',
}

const TeamInvitationEmail = ({ churchName, role, inviterName, dashboardUrl }: TeamInvitationProps) => {
  const roleLabel = role ? (ROLE_LABELS[role] || role) : 'Teammitglied'
  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Du wurdest zum Team von {churchName || 'einer Gemeinde'} eingeladen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>
          <Hr style={hrGold} />
          <Heading style={h1}>
            Einladung zum Team
          </Heading>
          <Text style={text}>
            {inviterName ? `${inviterName} hat` : 'Du wurdest'} dich als <strong>{roleLabel}</strong> zum Team von <strong>{churchName || 'einer Gemeinde'}</strong> auf {SITE_NAME} hinzugefügt.
          </Text>
          <Text style={text}>
            Mit {SITE_NAME} kannst du Gottesdienste planen, Abläufe teilen und im Team zusammenarbeiten.
          </Text>
          {dashboardUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Zum Dashboard
              </Button>
            </Section>
          )}
          <Hr style={hrLight} />
          <Text style={footer}>
            Herzliche Grüsse, das {SITE_NAME} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TeamInvitationEmail,
  subject: (data: Record<string, any>) =>
    `Einladung zum Team von ${data.churchName || 'deiner Gemeinde'}`,
  displayName: 'Team-Einladung',
  previewData: {
    churchName: 'Reformierte Kirche Zürich',
    role: 'musician',
    inviterName: 'Pfarrer Müller',
    dashboardUrl: 'https://biblebot.life/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = {
  backgroundColor: '#C8883A',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
}
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
