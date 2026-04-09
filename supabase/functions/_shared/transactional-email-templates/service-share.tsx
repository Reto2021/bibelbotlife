import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"

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
          <Heading style={h1}>
            Gottesdienstablauf
          </Heading>
          <Text style={text}>
            {senderName ? `${senderName} hat` : 'Es wurde'} dir den Ablauf für folgenden Gottesdienst geteilt:
          </Text>
          <Text style={detailsStyle}>
            <strong>{serviceTitle || 'Gottesdienst'}</strong>
            {dateFormatted && <><br />{dateFormatted}</>}
            {churchName && <><br />{churchName}</>}
          </Text>
          {downloadUrl && (
            <Button style={button} href={downloadUrl}>
              PDF herunterladen
            </Button>
          )}
          <Hr style={hr} />
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
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px' }
const detailsStyle = {
  fontSize: '15px',
  color: '#1a2a3a',
  lineHeight: '1.8',
  margin: '0 0 24px',
  backgroundColor: '#f7f3ec',
  padding: '16px 20px',
  borderRadius: '8px',
  borderLeft: '4px solid #c4862b',
}
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
