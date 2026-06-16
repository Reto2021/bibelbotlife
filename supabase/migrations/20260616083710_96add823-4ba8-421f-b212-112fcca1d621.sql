CREATE OR REPLACE FUNCTION public.admin_list_contacts()
RETURNS TABLE(
  email text,
  display_name text,
  sources text[],
  languages text[],
  countries text[],
  last_activity timestamptz,
  is_suppressed boolean,
  user_id uuid,
  church_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH unified AS (
    SELECT
      lower(u.email::text) AS email,
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email::text, '@', 1)) AS display_name,
      'app_user'::text AS source,
      NULL::text AS language,
      NULL::text AS country,
      COALESCE(u.last_sign_in_at, u.created_at) AS last_activity,
      u.id AS user_id,
      NULL::uuid AS church_id
    FROM auth.users u
    WHERE u.email IS NOT NULL

    UNION ALL

    SELECT
      lower(cp.contact_email) AS email,
      COALESCE(
        NULLIF(trim(coalesce(cp.contact_first_name,'') || ' ' || coalesce(cp.contact_last_name,'')), ''),
        cp.contact_person,
        cp.pastor_name,
        cp.name
      ) AS display_name,
      'church'::text AS source,
      cp.language,
      cp.country,
      cp.updated_at AS last_activity,
      cp.owner_id AS user_id,
      cp.id AS church_id
    FROM public.church_partners cp
    WHERE cp.contact_email IS NOT NULL AND cp.is_active = true
  )
  SELECT
    un.email,
    (array_agg(un.display_name ORDER BY un.last_activity DESC NULLS LAST))[1] AS display_name,
    array_agg(DISTINCT un.source) AS sources,
    array_remove(array_agg(DISTINCT un.language), NULL) AS languages,
    array_remove(array_agg(DISTINCT un.country), NULL) AS countries,
    max(un.last_activity) AS last_activity,
    EXISTS(SELECT 1 FROM public.suppressed_emails s WHERE lower(s.email) = un.email) AS is_suppressed,
    (array_agg(un.user_id) FILTER (WHERE un.user_id IS NOT NULL))[1] AS user_id,
    (array_agg(un.church_id) FILTER (WHERE un.church_id IS NOT NULL))[1] AS church_id
  FROM unified un
  WHERE un.email IS NOT NULL AND un.email <> ''
  GROUP BY un.email
  ORDER BY max(un.last_activity) DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_contacts() TO authenticated;