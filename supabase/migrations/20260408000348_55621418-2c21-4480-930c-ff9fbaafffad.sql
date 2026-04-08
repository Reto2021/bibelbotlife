CREATE TABLE public.church_partnership_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  church_name text,
  preferred_tier text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.church_partnership_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inquiry" ON public.church_partnership_inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "No public reads" ON public.church_partnership_inquiries
  FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "Service role full access" ON public.church_partnership_inquiries
  FOR ALL TO service_role USING (true) WITH CHECK (true);