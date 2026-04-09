
-- 1. Remove public SELECT on prayer_requests base table
DROP POLICY IF EXISTS "Anyone can read prayer requests" ON public.prayer_requests;

-- 2. Add admin-only read on base table
CREATE POLICY "Admins can read all prayer requests"
  ON public.prayer_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create safe public view (no author_name, no session_id)
CREATE OR REPLACE VIEW public.prayer_requests_public AS
SELECT
  id,
  content,
  prayer_count,
  is_anonymous,
  created_at
FROM public.prayer_requests;

-- 4. Grant access on the view to anon + authenticated
GRANT SELECT ON public.prayer_requests_public TO anon, authenticated;

-- 5. Activate analytics validation trigger (function already exists)
CREATE TRIGGER validate_analytics_before_insert
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_analytics_event();
