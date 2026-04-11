
-- 1. referral_partners
CREATE TABLE public.referral_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  ghl_contact_id TEXT,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_commission NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referral partners"
  ON public.referral_partners FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages referral partners"
  ON public.referral_partners FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_referral_partners_updated_at
  BEFORE UPDATE ON public.referral_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. referral_clicks
CREATE TABLE public.referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  landing_page TEXT,
  ip_hash TEXT,
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert referral clicks"
  ON public.referral_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "No public reads on referral clicks"
  ON public.referral_clicks FOR SELECT TO anon, authenticated
  USING (false);

CREATE POLICY "Admins can read referral clicks"
  ON public.referral_clicks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages referral clicks"
  ON public.referral_clicks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Validation trigger for clicks
CREATE OR REPLACE FUNCTION public.validate_referral_click()
  RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(NEW.referral_code) > 50 THEN RAISE EXCEPTION 'referral_code too long'; END IF;
  IF NEW.landing_page IS NOT NULL AND length(NEW.landing_page) > 2000 THEN
    NEW.landing_page := left(NEW.landing_page, 2000);
  END IF;
  IF NEW.session_id IS NOT NULL AND length(NEW.session_id) > 100 THEN RAISE EXCEPTION 'session_id too long'; END IF;
  IF NEW.user_agent IS NOT NULL AND length(NEW.user_agent) > 500 THEN
    NEW.user_agent := left(NEW.user_agent, 500);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER validate_referral_click_trigger
  BEFORE INSERT ON public.referral_clicks
  FOR EACH ROW EXECUTE FUNCTION public.validate_referral_click();

-- Trigger to increment partner click count
CREATE OR REPLACE FUNCTION public.increment_referral_clicks()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.referral_partners SET total_clicks = total_clicks + 1 WHERE code = NEW.referral_code;
  RETURN NEW;
END; $$;

CREATE TRIGGER increment_referral_clicks_trigger
  AFTER INSERT ON public.referral_clicks
  FOR EACH ROW EXECUTE FUNCTION public.increment_referral_clicks();

-- 3. referral_conversions
CREATE TABLE public.referral_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.referral_partners(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES public.church_partnership_inquiries(id) ON DELETE SET NULL,
  deal_value NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  ghl_webhook_status TEXT NOT NULL DEFAULT 'pending',
  ghl_webhook_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referral conversions"
  ON public.referral_conversions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages referral conversions"
  ON public.referral_conversions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. Add referral_code to church_partnership_inquiries
ALTER TABLE public.church_partnership_inquiries ADD COLUMN referral_code TEXT;
