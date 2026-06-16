DROP FUNCTION IF EXISTS public.admin_list_contacts();

CREATE TABLE public.user_marketing_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bibelbot_news boolean NOT NULL DEFAULT false,
  bibelbot_news_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_marketing_preferences TO authenticated;
GRANT ALL ON public.user_marketing_preferences TO service_role;

ALTER TABLE public.user_marketing_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own marketing prefs"
  ON public.user_marketing_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own marketing prefs"
  ON public.user_marketing_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own marketing prefs"
  ON public.user_marketing_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all marketing prefs"
  ON public.user_marketing_preferences FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_user_marketing_prefs_updated_at
  BEFORE UPDATE ON public.user_marketing_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.church_partners
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

ALTER TABLE public.daily_subscribers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_daily_subscribers_email
  ON public.daily_subscribers (lower(email)) WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_list_contacts()
RETURNS TABLE(
  email text, display_name text, sources text[], languages text[], countries text[],
  last_activity timestamptz, is_suppressed boolean, has_consent boolean,
  user_id uuid, church_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  WITH unified AS (
    SELECT lower(u.email::text) AS email,
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1)) AS display_name,
      'app_user'::text AS source, NULL::text AS language, NULL::text AS country,
      COALESCE(u.last_sign_in_at, u.created_at) AS last_activity,
      COALESCE(ump.bibelbot_news, false) AS consent,
      u.id AS user_id, NULL::uuid AS church_id
    FROM auth.users u
    LEFT JOIN public.user_marketing_preferences ump ON ump.user_id = u.id
    WHERE u.email IS NOT NULL
    UNION ALL
    SELECT lower(cp.contact_email),
      COALESCE(NULLIF(trim(coalesce(cp.contact_first_name,'')||' '||coalesce(cp.contact_last_name,'')),''),
               cp.contact_person, cp.pastor_name, cp.name),
      'church'::text, cp.language, cp.country, cp.updated_at,
      COALESCE(cp.marketing_consent, false), cp.owner_id, cp.id
    FROM public.church_partners cp
    WHERE cp.contact_email IS NOT NULL AND cp.is_active = true
    UNION ALL
    SELECT lower(ds.email), ds.first_name, 'daily'::text, ds.language, NULL::text, ds.updated_at,
      COALESCE(ds.marketing_consent, false), NULL::uuid, NULL::uuid
    FROM public.daily_subscribers ds
    WHERE ds.email IS NOT NULL AND ds.is_active = true
  )
  SELECT un.email,
    (array_agg(un.display_name ORDER BY un.last_activity DESC NULLS LAST))[1],
    array_agg(DISTINCT un.source),
    array_remove(array_agg(DISTINCT un.language), NULL),
    array_remove(array_agg(DISTINCT un.country), NULL),
    max(un.last_activity),
    EXISTS(SELECT 1 FROM public.suppressed_emails s WHERE lower(s.email) = un.email),
    bool_or(un.consent),
    (array_agg(un.user_id) FILTER (WHERE un.user_id IS NOT NULL))[1],
    (array_agg(un.church_id) FILTER (WHERE un.church_id IS NOT NULL))[1]
  FROM unified un
  WHERE un.email IS NOT NULL AND un.email <> ''
  GROUP BY un.email
  ORDER BY max(un.last_activity) DESC NULLS LAST;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_list_contacts() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_optin_contacts()
RETURNS TABLE(email text, display_name text, sources text[], languages text[], last_activity timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY
  SELECT c.email, c.display_name, c.sources, c.languages, c.last_activity
  FROM public.admin_list_contacts() c
  WHERE c.has_consent = true AND c.is_suppressed = false;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_list_optin_contacts() TO authenticated;