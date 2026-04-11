import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BibleBot.Life"
const LOGO_URL = 'https://swsthxftugjqznqjcfpk.supabase.co/storage/v1/object/public/share-images/email%2Fbiblebot-logo.png'

interface InvoiceNotificationProps {
  churchName?: string
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  amount?: string
  currency?: string
  downloadUrl?: string
  contactName?: string
}

const InvoiceNotificationEmail = ({
  churchName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  amount,
  currency = 'CHF',
  downloadUrl,
  contactName,
}: InvoiceNotificationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Rechnung {invoiceNumber || ''} von {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={SITE_NAME} width="56" height="56" style={logoImg} />
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>
        <Hr style={hrGold} />

        <Heading style={h1}>
          Rechnung {invoiceNumber || ''}
        </Heading>

        <Text style={text}>
          {contactName ? `Guten Tag ${contactName},` : 'Guten Tag,'}
        </Text>

        <Text style={text}>
          anbei erhalten Sie die Rechnung für {churchName ? `die Gemeinde «${churchName}»` : 'Ihre Gemeinde'}.
        </Text>

        <Section style={detailsBox}>
          <Text style={detailRow}>
            <strong>Rechnungsnr.:</strong> {invoiceNumber || '–'}
          </Text>
          <Text style={detailRow}>
            <strong>Datum:</strong> {invoiceDate || '–'}
          </Text>
          <Text style={detailRow}>
            <strong>Fällig bis:</strong> {dueDate || '–'}
          </Text>
          <Text style={detailRow}>
            <strong>Betrag:</strong> {currency} {amount || '–'}
          </Text>
        </Section>

        {downloadUrl && (
          <Section style={buttonSection}>
            <Button style={button} href={downloadUrl}>
              Rechnung herunterladen (PDF)
            </Button>
          </Section>
        )}

        <Text style={text}>
          Bei Fragen zur Rechnung können Sie jederzeit auf diese E-Mail antworten.
        </Text>

        <Hr style={hrLight} />
        <Text style={footer}>
          Herzliche Grüsse, das {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvoiceNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Rechnung ${data.invoiceNumber || ''} – ${SITE_NAME}`,
  displayName: 'Rechnungsbenachrichtigung',
  previewData: {
    churchName: 'Reformierte Kirche Zürich',
    invoiceNumber: 'INV-2026-0042',
    invoiceDate: '09.04.2026',
    dueDate: '30.04.2026',
    amount: '49.00',
    currency: 'CHF',
    downloadUrl: 'https://example.com/invoice.pdf',
    contactName: 'Pfarrer Müller',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { margin: '0 auto', borderRadius: '12px' }
const brandText = { fontSize: '18px', fontWeight: '700' as const, color: '#C8883A', margin: '8px 0 0', letterSpacing: '0.3px' }
const hrGold = { borderColor: '#C8883A', margin: '16px 0 24px', borderWidth: '2px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2a3a', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = {
  backgroundColor: '#f8f5f0',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '8px 0 24px',
  borderLeft: '4px solid #C8883A',
}
const detailRow = { fontSize: '14px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 4px' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const button = {
  backgroundColor: '#C8883A',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
}
const hrLight = { borderColor: '#e2c496', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
