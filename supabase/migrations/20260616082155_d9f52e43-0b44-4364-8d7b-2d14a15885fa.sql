ALTER TABLE public.church_partners
  ADD COLUMN IF NOT EXISTS contact_gender text CHECK (contact_gender IN ('male','female','diverse')),
  ADD COLUMN IF NOT EXISTS contact_first_name text,
  ADD COLUMN IF NOT EXISTS contact_last_name text;

ALTER TABLE public.outreach_leads
  ADD COLUMN IF NOT EXISTS contact_gender text CHECK (contact_gender IN ('male','female','diverse')),
  ADD COLUMN IF NOT EXISTS contact_first_name text,
  ADD COLUMN IF NOT EXISTS contact_last_name text;