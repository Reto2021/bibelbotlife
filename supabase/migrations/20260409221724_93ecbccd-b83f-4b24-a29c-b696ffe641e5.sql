
-- email_unsubscribe_tokens: explicit deny for anon+authenticated
CREATE POLICY "No anon access on unsubscribe tokens"
  ON public.email_unsubscribe_tokens FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No authenticated access on unsubscribe tokens"
  ON public.email_unsubscribe_tokens FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- suppressed_emails: explicit deny for anon+authenticated
CREATE POLICY "No anon access on suppressed emails"
  ON public.suppressed_emails FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No authenticated access on suppressed emails"
  ON public.suppressed_emails FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- email_send_log: explicit deny for anon+authenticated
CREATE POLICY "No anon access on email send log"
  ON public.email_send_log FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No authenticated access on email send log"
  ON public.email_send_log FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- email_send_state: explicit deny for anon+authenticated
CREATE POLICY "No anon access on email send state"
  ON public.email_send_state FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No authenticated access on email send state"
  ON public.email_send_state FOR ALL TO authenticated
  USING (false) WITH CHECK (false);
