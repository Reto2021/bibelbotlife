
-- Remove the view approach
DROP VIEW IF EXISTS public.prayer_requests_public;

-- Re-add a public SELECT policy (needed for the insert/increment flow)
CREATE POLICY "Anyone can read prayer requests"
  ON public.prayer_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create a SECURITY DEFINER function that returns only safe columns
CREATE OR REPLACE FUNCTION public.get_public_prayers()
RETURNS TABLE (
  id uuid,
  content text,
  prayer_count integer,
  is_anonymous boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, content, prayer_count, is_anonymous, created_at
  FROM public.prayer_requests
  ORDER BY created_at DESC;
$$;
