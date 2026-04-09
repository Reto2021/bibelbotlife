CREATE OR REPLACE FUNCTION public.is_church_owner(_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_partners cp
    WHERE cp.id = _church_id
      AND cp.owner_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_church_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_church_owner(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_church()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  denomination text,
  city text,
  country text,
  language text,
  logo_url text,
  is_active boolean,
  custom_bot_name text,
  primary_color text,
  secondary_color text,
  contact_person text,
  contact_email text,
  contact_phone text,
  website text,
  pastor_name text,
  pastor_photo_url text,
  plan_tier public.church_plan_tier,
  service_times text,
  subscription_status text,
  subscription_started_at timestamptz,
  subscription_expires_at timestamptz,
  telegram_group_link text,
  welcome_message text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cp.id,
    cp.name,
    cp.slug,
    cp.denomination,
    cp.city,
    cp.country,
    cp.language,
    cp.logo_url,
    cp.is_active,
    cp.custom_bot_name,
    cp.primary_color,
    cp.secondary_color,
    cp.contact_person,
    cp.contact_email,
    cp.contact_phone,
    cp.website,
    cp.pastor_name,
    cp.pastor_photo_url,
    cp.plan_tier,
    cp.service_times,
    cp.subscription_status,
    cp.subscription_started_at,
    cp.subscription_expires_at,
    cp.telegram_group_link,
    cp.welcome_message,
    cp.created_at,
    cp.updated_at
  FROM public.church_partners cp
  WHERE cp.owner_id = auth.uid()
  ORDER BY cp.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_church() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_church() TO authenticated, service_role;

DROP POLICY IF EXISTS "Owner can view own church" ON public.church_partners;

DROP POLICY IF EXISTS "Owner can insert own billing" ON public.church_billing;
CREATE POLICY "Owner can insert own billing"
ON public.church_billing
FOR INSERT
TO authenticated
WITH CHECK (public.is_church_owner(church_id));

DROP POLICY IF EXISTS "Owner can update own billing" ON public.church_billing;
CREATE POLICY "Owner can update own billing"
ON public.church_billing
FOR UPDATE
TO authenticated
USING (public.is_church_owner(church_id))
WITH CHECK (public.is_church_owner(church_id));

DROP POLICY IF EXISTS "Owner can view own billing" ON public.church_billing;
CREATE POLICY "Owner can view own billing"
ON public.church_billing
FOR SELECT
TO authenticated
USING (public.is_church_owner(church_id));

DROP POLICY IF EXISTS "Church owners can view own invoices" ON public.invoices;
CREATE POLICY "Church owners can view own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (public.is_church_owner(church_id));

DELETE FROM public.chat_messages m
USING public.chat_conversations c
WHERE m.conversation_id = c.id
  AND c.user_id IS NULL;

DELETE FROM public.chat_conversations
WHERE user_id IS NULL;

ALTER TABLE public.chat_conversations
ALTER COLUMN user_id SET NOT NULL;