
CREATE OR REPLACE FUNCTION public.lookup_circle_by_invite_code(_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.circles c
  WHERE c.invite_code = _code
  LIMIT 1;
$$;
