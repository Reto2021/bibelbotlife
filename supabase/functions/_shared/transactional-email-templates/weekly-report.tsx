/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Row, Column, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'BibleBot.Life'

interface SourceEntry { name: string; count: number }
interface PageEntry { path: string; count: number }

interface WeeklyReportProps {
  churchName?: string
  botName?: string
  periodLabel?: string
  pageviews?: number
  sessions?: number
  interactions?: number
  topSources?: SourceEntry[]
  topPages?: PageEntry[]
  mobile?: number
  tablet?: number
  desktop?: number
}

const WeeklyReportEmail = ({
  churchName = 'Meine Gemeinde',
  botName = 'BibleBot',
  periodLabel = '',
  pageviews = 0,
  sessions = 0,
  interactions = 0,
  topSources = [],
  topPages = [],
  mobile = 0,
  tablet = 0,
  desktop = 0,
}: WeeklyReportProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>📊 Wöchentlicher {botName}-Report für {churchName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📊 Wöchentlicher {botName}-Report</Heading>
        <Text style={subtitle}>{periodLabel}</Text>
        <Text style={churchLabel}>{churchName}</Text>

        {/* KPI row */}
        <Section style={kpiRow}>
          <Row>
            <Column style={kpiCell}>
              <Text style={kpiNumber}>{pageviews}</Text>
              <Text style={kpiLabel}>Seitenaufrufe</Text>
            </Column>
            <Column style={kpiSpacer} />
            <Column style={kpiCell}>
              <Text style={kpiNumber}>{sessions}</Text>
              <Text style={kpiLabel}>Besucher</Text>
            </Column>
            <Column style={kpiSpacer} />
            <Column style={kpiCell}>
              <Text style={kpiNumber}>{interactions}</Text>
              <Text style={kpiLabel}>Interaktionen</Text>
            </Column>
          </Row>
        </Section>

        {/* Traffic sources */}
        <Heading as="h3" style={sectionHeading}>🔗 Traffic-Quellen</Heading>
        {topSources.length > 0 ? (
          topSources.map((s, i) => (
            <Text key={i} style={tableRow}>
              {s.name} <span style={tableCount}>{s.count}</span>
            </Text>
          ))
        ) : (
          <Text style={emptyText}>Keine Quellen erfasst</Text>
        )}

        {/* Top pages */}
        <Heading as="h3" style={sectionHeading}>📄 Top Seiten</Heading>
        {topPages.length > 0 ? (
          topPages.map((p, i) => (
            <Text key={i} style={tableRow}>
              <span style={monoText}>{p.path}</span> <span style={tableCount}>{p.count}</span>
            </Text>
          ))
        ) : (
          <Text style={emptyText}>Keine Seitenaufrufe</Text>
        )}

        {/* Devices */}
        <Heading as="h3" style={sectionHeading}>📱 Geräte</Heading>
        <Text style={deviceText}>
          Mobile: {mobile} · Tablet: {tablet} · Desktop: {desktop}
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Dieser Report wurde automatisch von <strong>{botName}</strong> erstellt.
        </Text>
        <Text style={footerSmall}>Powered by {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WeeklyReportEmail,
  subject: (data: Record<string, any>) =>
    `📊 ${data.botName || 'BibleBot'} Wochenbericht – ${data.periodLabel || 'Diese Woche'}`,
  displayName: 'Wöchentlicher Analytics-Report',
  previewData: {
    churchName: 'Friedenskirche Zürich',
    botName: 'BibelBot',
    periodLabel: '01.01.2025 – 07.01.2025',
    pageviews: 234,
    sessions: 89,
    interactions: 45,
    topSources: [
      { name: 'qr_code', count: 42 },
      { name: 'widget', count: 28 },
      { name: 'outreach', count: 15 },
    ],
    topPages: [
      { path: '/', count: 120 },
      { path: '/chat', count: 65 },
      { path: '/impulse', count: 49 },
    ],
    mobile: 52,
    tablet: 12,
    desktop: 25,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#C8883A', margin: '0 0 4px', textAlign: 'center' as const }
const subtitle = { fontSize: '13px', color: '#888888', margin: '0 0 4px', textAlign: 'center' as const }
const churchLabel = { fontSize: '14px', color: '#666666', margin: '0 0 24px', textAlign: 'center' as const }
const kpiRow = { marginBottom: '24px' }
const kpiCell = { padding: '16px', backgroundColor: '#f8f4ef', borderRadius: '8px', textAlign: 'center' as const, width: '30%' }
const kpiSpacer = { width: '5%' }
const kpiNumber = { fontSize: '28px', fontWeight: 'bold' as const, color: '#C8883A', margin: '0' }
const kpiLabel = { fontSize: '12px', color: '#888888', margin: '4px 0 0' }
const sectionHeading = { fontSize: '15px', borderBottom: '2px solid #C8883A', paddingBottom: '6px', margin: '20px 0 10px' }
const tableRow = { fontSize: '13px', color: '#333333', margin: '2px 0', padding: '4px 0', borderBottom: '1px solid #eeeeee' }
const tableCount = { float: 'right' as const, fontWeight: 'bold' as const }
const monoText = { fontFamily: 'monospace', fontSize: '12px' }
const emptyText = { fontSize: '13px', color: '#888888', fontStyle: 'italic' as const }
const deviceText = { fontSize: '13px', color: '#666666' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#666666', textAlign: 'center' as const, margin: '0' }
const footerSmall = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '4px 0 0' }
