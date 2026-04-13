/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as contactNotification } from './contact-notification.tsx'
import { template as churchOnboarding } from './church-onboarding.tsx'
import { template as invoiceNotification } from './invoice-notification.tsx'
import { template as teamInvitation } from './team-invitation.tsx'
import { template as serviceShare } from './service-share.tsx'
import { template as qrSticker } from './qr-sticker.tsx'
import { template as weeklyReport } from './weekly-report.tsx'
import { template as firstContactNotification } from './first-contact-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'contact-notification': contactNotification,
  'church-onboarding': churchOnboarding,
  'invoice-notification': invoiceNotification,
  'team-invitation': teamInvitation,
  'service-share': serviceShare,
  'qr-sticker': qrSticker,
  'weekly-report': weeklyReport,
  'first-contact-notification': firstContactNotification,
}
