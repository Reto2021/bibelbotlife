CREATE POLICY "Service can update subscribers"
  ON public.daily_subscribers
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);