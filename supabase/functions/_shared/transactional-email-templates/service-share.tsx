import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

interface ServiceShareProps {
  serviceTitle?: string
  serviceDate?: string
  churchName?: string
  downloadUrl?: string
  senderName?: string
}

const ServiceShareEmail = ({ serviceTitle, serviceDate, churchName, downloadUrl, senderName }: ServiceShareProps) => {
  const dateFormatted = serviceDate
    ? new Date(serviceDate).toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Gottesdienstablauf: {serviceTitle || 'Gottesdienst'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>
          <Hr style={hrGold} />
          <Heading style={h1}>
            Gottesdienstablauf
          </Heading>
          <Text style={text}>
            {senderName ? `${senderName} hat` : 'Es wurde'} dir den Ablauf für folgenden Gottesdienst geteilt:
          </Text>
          <Section style={detailsStyle}>
            <Text style={detailText}>
              <strong>{serviceTitle || 'Gottesdienst'}</strong>
              {dateFormatted && <><br />{dateFormatted}</>}
              {churchName && <><br />{churchName}</>}
            </Text>
          </Section>
          {downloadUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={downloadUrl}>
                PDF herunterladen
              </Button>
            </Section>
          )}
          <Hr style={hrLight} />
          <Text style={footer}>
            Geteilt über {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ServiceShareEmail,
  subject: (data: Record<string, any>) =>
    `Gottesdienstablauf: ${data.serviceTitle || 'Gottesdienst'}`,
  displayName: 'Gottesdienst teilen',
  previewData: {
    serviceTitle: 'Erntedank-Gottesdienst',
    serviceDate: '2025-10-12',
    churchName: 'Reformierte Kirche Zürich',
    downloadUrl: 'https://example.com/download/service.pdf',
    senderName: 'Pfarrer Müller',
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
const detailsStyle = {
  backgroundColor: '#f7f3ec',
  padding: '16px 20px',
  borderRadius: '8px',
  borderLeft: '4px solid #C8883A',
  margin: '0 0 24px',
}
const detailText = { fontSize: '15px', color: '#1a2a3a', lineHeight: '1.8', margin: '0' }
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
