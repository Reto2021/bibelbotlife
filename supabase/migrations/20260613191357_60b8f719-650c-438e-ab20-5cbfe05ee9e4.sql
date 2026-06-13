
-- Fix 1: Make the deny-public-reads policy explicit for both anon and authenticated
DROP POLICY IF EXISTS "No public reads on ab test events" ON public.ab_test_events;
CREATE POLICY "No public reads on ab test events"
  ON public.ab_test_events
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- Fix 2: Recreate church_partners_public view without telegram_group_link
DROP VIEW IF EXISTS public.church_partners_public;
CREATE VIEW public.church_partners_public AS
  SELECT id, name, slug, denomination, city, country, language,
         logo_url, primary_color, secondary_color, pastor_name,
         pastor_photo_url, welcome_message, service_times, website,
         custom_bot_name, contact_person, plan_tier, is_active,
         created_at, updated_at
    FROM public.church_partners
   WHERE is_active = true;

GRANT SELECT ON public.church_partners_public TO anon, authenticated;
