DROP POLICY IF EXISTS "Anyone can insert referral clicks" ON public.referral_clicks;
CREATE POLICY "Anyone can insert referral clicks" ON public.referral_clicks FOR INSERT TO anon, authenticated
WITH CHECK (length(referral_code) BETWEEN 1 AND 100 AND (landing_page IS NULL OR length(landing_page) <= 2000));

DROP POLICY IF EXISTS "Anyone can insert ab test events" ON public.ab_test_events;
CREATE POLICY "Anyone can insert ab test events" ON public.ab_test_events FOR INSERT TO anon, authenticated
WITH CHECK (length(variant) BETWEEN 1 AND 50 AND length(event_type) BETWEEN 1 AND 50);