
-- Plan tier enum
CREATE TYPE public.church_plan_tier AS ENUM ('free', 'community', 'gemeinde', 'kirche');

-- Church partners table
CREATE TABLE public.church_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  denomination TEXT,
  city TEXT,
  country TEXT DEFAULT 'CH',
  language TEXT DEFAULT 'de',
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  service_times TEXT,
  welcome_message TEXT,
  pastor_name TEXT,
  pastor_photo_url TEXT,
  plan_tier church_plan_tier NOT NULL DEFAULT 'free',
  telegram_group_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.church_partners ENABLE ROW LEVEL SECURITY;

-- Public can read active partners
CREATE POLICY "Anyone can view active church partners"
  ON public.church_partners FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only service_role can manage
CREATE POLICY "Service role manages church partners"
  ON public.church_partners FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Church contact requests table
CREATE TABLE public.church_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.church_contact_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact request
CREATE POLICY "Anyone can submit contact request"
  ON public.church_contact_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public reads
CREATE POLICY "No public reads on contact requests"
  ON public.church_contact_requests FOR SELECT
  TO anon, authenticated
  USING (false);
