-- 1. Allow public to read only approved prayer requests
CREATE POLICY "Anyone can read approved prayer requests"
  ON public.prayer_requests
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

-- 2. Deny deletion of subscribers for non-service roles
CREATE POLICY "No public delete on subscribers"
  ON public.daily_subscribers
  FOR DELETE
  TO anon, authenticated
  USING (false);