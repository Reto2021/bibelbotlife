
-- Extend outreach_leads with branding columns
ALTER TABLE outreach_leads
ADD COLUMN IF NOT EXISTS scraped_branding jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS website_score smallint,
ADD COLUMN IF NOT EXISTS primary_color text,
ADD COLUMN IF NOT EXISTS secondary_color text,
ADD COLUMN IF NOT EXISTS text_color text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS screenshot_url text,
ADD COLUMN IF NOT EXISTS ab_variant_color text,
ADD COLUMN IF NOT EXISTS ab_variant_chosen text;

-- Create ab_test_events table
CREATE TABLE public.ab_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES outreach_leads(id) ON DELETE CASCADE NOT NULL,
  variant text NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (tracking pixel from public pages)
CREATE POLICY "Anyone can insert ab test events"
ON public.ab_test_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read ab test events"
ON public.ab_test_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No public reads
CREATE POLICY "No public reads on ab test events"
ON public.ab_test_events FOR SELECT
TO anon
USING (false);

-- Service role full access
CREATE POLICY "Service role manages ab test events"
ON public.ab_test_events FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for analytics queries
CREATE INDEX idx_ab_test_events_lead_id ON public.ab_test_events(lead_id);
CREATE INDEX idx_ab_test_events_variant ON public.ab_test_events(variant, event_type);
