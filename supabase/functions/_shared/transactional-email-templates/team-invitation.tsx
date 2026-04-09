import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"

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
            <Button style={button} href={dashboardUrl}>
              Zum Dashboard
            </Button>
          )}
          <Hr style={hr} />
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
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const button = {
  backgroundColor: '#c4862b',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  margin: '0 0 24px',
}
const hr = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
