
-- 1. Create a public view that hides sensitive fields
CREATE OR REPLACE VIEW public.church_partners_public AS
SELECT
  id,
  slug,
  name,
  denomination,
  city,
  country,
  language,
  logo_url,
  website,
  service_times,
  welcome_message,
  pastor_name,
  pastor_photo_url,
  telegram_group_link,
  custom_bot_name,
  primary_color,
  secondary_color,
  plan_tier,
  contact_person,
  is_active,
  created_at,
  updated_at
FROM public.church_partners
WHERE is_active = true;

-- 2. Grant access to the view for anon and authenticated
GRANT SELECT ON public.church_partners_public TO anon, authenticated;

-- 3. Remove the open SELECT policy that exposes all columns to anyone
DROP POLICY IF EXISTS "Anyone can view active church partners" ON public.church_partners;

-- 4. Add a policy so owners can still SELECT their own church (all columns)
CREATE POLICY "Owner can view own church"
  ON public.church_partners FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());
