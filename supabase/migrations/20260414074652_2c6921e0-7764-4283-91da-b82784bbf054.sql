CREATE OR REPLACE FUNCTION public.get_registered_user_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM auth.users;
$$;