
-- 1. Create church_billing table
CREATE TABLE public.church_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL UNIQUE REFERENCES public.church_partners(id) ON DELETE CASCADE,
  billing_name text,
  billing_street text,
  billing_zip text,
  billing_city text,
  billing_country text DEFAULT 'CH',
  billing_email text,
  billing_reference text,
  billing_interval text DEFAULT 'yearly',
  iban text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.church_billing ENABLE ROW LEVEL SECURITY;

-- 3. Policies: owner + admin only
CREATE POLICY "Owner can view own billing"
  ON public.church_billing FOR SELECT TO authenticated
  USING (church_id IN (SELECT id FROM public.church_partners WHERE owner_id = auth.uid()));

CREATE POLICY "Owner can update own billing"
  ON public.church_billing FOR UPDATE TO authenticated
  USING (church_id IN (SELECT id FROM public.church_partners WHERE owner_id = auth.uid()))
  WITH CHECK (church_id IN (SELECT id FROM public.church_partners WHERE owner_id = auth.uid()));

CREATE POLICY "Owner can insert own billing"
  ON public.church_billing FOR INSERT TO authenticated
  WITH CHECK (church_id IN (SELECT id FROM public.church_partners WHERE owner_id = auth.uid()));

CREATE POLICY "Admins can manage all billing"
  ON public.church_billing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages billing"
  ON public.church_billing FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. Timestamp trigger
CREATE TRIGGER update_church_billing_updated_at
  BEFORE UPDATE ON public.church_billing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Migrate existing data
INSERT INTO public.church_billing (church_id, billing_name, billing_street, billing_zip, billing_city, billing_country, billing_email, billing_reference, billing_interval, iban)
SELECT id, billing_name, billing_street, billing_zip, billing_city, billing_country, billing_email, billing_reference, billing_interval, iban
FROM public.church_partners
WHERE billing_name IS NOT NULL OR billing_email IS NOT NULL OR iban IS NOT NULL;

-- 6. Drop billing columns from church_partners
ALTER TABLE public.church_partners
  DROP COLUMN billing_name,
  DROP COLUMN billing_street,
  DROP COLUMN billing_zip,
  DROP COLUMN billing_city,
  DROP COLUMN billing_country,
  DROP COLUMN billing_email,
  DROP COLUMN billing_reference,
  DROP COLUMN billing_interval,
  DROP COLUMN iban;
