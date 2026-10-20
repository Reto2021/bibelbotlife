DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated
WITH CHECK (event_type IN ('pageview','event') AND length(session_id) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.daily_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.daily_subscribers FOR INSERT TO anon, authenticated
WITH CHECK (length(channel) BETWEEN 1 AND 30 AND (email IS NULL OR length(email) <= 320));

DROP POLICY IF EXISTS "Anyone can insert referral clicks" ON public.referral_clicks;
CREATE POLICY "Anyone can insert referral clicks" ON public.referral_clicks FOR INSERT TO anon, authenticated
WITH CHECK (length(referral_code) BETWEEN 1 AND 100 AND EXISTS (SELECT 1 FROM public.referral_partners rp WHERE rp.code = referral_code AND rp.is_active = true));

DROP POLICY IF EXISTS "Anyone can create prayer requests" ON public.prayer_requests;
CREATE POLICY "Anyone can create prayer requests" ON public.prayer_requests FOR INSERT TO anon, authenticated
WITH CHECK (length(trim(content)) BETWEEN 1 AND 2000 AND length(session_id) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "Anyone can insert quiz scores" ON public.quiz_scores;
CREATE POLICY "Anyone can insert quiz scores" ON public.quiz_scores FOR INSERT TO anon, authenticated
WITH CHECK (score BETWEEN 0 AND 1000 AND total_questions BETWEEN 1 AND 100 AND length(session_id) BETWEEN 1 AND 100);

DROP POLICY IF EXISTS "Anyone can insert ab test events" ON public.ab_test_events;
CREATE POLICY "Anyone can insert ab test events" ON public.ab_test_events FOR INSERT TO anon, authenticated
WITH CHECK (length(variant) BETWEEN 1 AND 50 AND length(event_type) BETWEEN 1 AND 50 AND EXISTS (SELECT 1 FROM public.outreach_leads l WHERE l.id = lead_id));

DROP POLICY IF EXISTS "Anyone can submit contact request" ON public.church_contact_requests;
CREATE POLICY "Anyone can submit contact request" ON public.church_contact_requests FOR INSERT TO anon, authenticated
WITH CHECK (length(trim(message)) BETWEEN 1 AND 5000 AND length(sender_email) BETWEEN 3 AND 320 AND EXISTS (SELECT 1 FROM public.church_partners cp WHERE cp.id = church_id AND cp.is_active = true));

DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.church_partnership_inquiries;
CREATE POLICY "Anyone can submit inquiry" ON public.church_partnership_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (length(trim(name)) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND length(trim(message)) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT TO anon, authenticated
WITH CHECK (length(trim(name)) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND length(trim(message)) BETWEEN 1 AND 5000);