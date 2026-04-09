
-- Campaign status enum
CREATE TYPE public.outreach_campaign_status AS ENUM ('active', 'paused', 'completed');

-- Lead status enum
CREATE TYPE public.outreach_lead_status AS ENUM ('new', 'contacted', 'replied', 'booked', 'converted', 'unsubscribed');

-- Email status enum
CREATE TYPE public.outreach_email_status AS ENUM ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced');

-- Campaigns table
CREATE TABLE public.outreach_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status public.outreach_campaign_status NOT NULL DEFAULT 'paused',
  sender_name text NOT NULL DEFAULT 'BibleBot.Life',
  sender_email text NOT NULL,
  booking_url text,
  target_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_emails_per_day integer NOT NULL DEFAULT 50,
  max_emails_per_hour integer NOT NULL DEFAULT 10,
  send_start_hour integer NOT NULL DEFAULT 8,
  send_end_hour integer NOT NULL DEFAULT 18,
  send_weekdays_only boolean NOT NULL DEFAULT true,
  blacklist_domains text[] NOT NULL DEFAULT '{}'::text[],
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
  ON public.outreach_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_outreach_campaigns_updated_at
  BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads table
CREATE TABLE public.outreach_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  church_name text NOT NULL,
  contact_name text,
  email text NOT NULL,
  website text,
  city text,
  denomination text,
  scraped_data jsonb DEFAULT '{}'::jsonb,
  personal_note text,
  status public.outreach_lead_status NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'csv_import',
  current_step integer NOT NULL DEFAULT 0,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads"
  ON public.outreach_leads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_outreach_leads_updated_at
  BEFORE UPDATE ON public.outreach_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_outreach_leads_campaign ON public.outreach_leads(campaign_id);
CREATE INDEX idx_outreach_leads_status ON public.outreach_leads(status);
CREATE INDEX idx_outreach_leads_email ON public.outreach_leads(email);

-- Sequences table
CREATE TABLE public.outreach_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  delay_days integer NOT NULL DEFAULT 3,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, step_number)
);

ALTER TABLE public.outreach_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sequences"
  ON public.outreach_sequences FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_outreach_sequences_updated_at
  BEFORE UPDATE ON public.outreach_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Emails log table
CREATE TABLE public.outreach_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.outreach_leads(id) ON DELETE CASCADE,
  sequence_step integer NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status public.outreach_email_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  resend_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage outreach emails"
  ON public.outreach_emails FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_outreach_emails_lead ON public.outreach_emails(lead_id);
CREATE INDEX idx_outreach_emails_status ON public.outreach_emails(status);
