
-- 1. Fix function search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = pgmq, public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = pgmq, public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = pgmq, public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = pgmq, public;

-- 2. app_settings: restrict public reads to non-sensitive keys
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

CREATE POLICY "Public reads safe app settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (
  key LIKE 'impulse\_%' ESCAPE '\'
  OR key = 'show_pricing'
);

CREATE POLICY "Admins can read all app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. church_contact_requests: allow church owners to read their own requests
CREATE POLICY "Church owners can read their contact requests"
ON public.church_contact_requests
FOR SELECT
TO authenticated
USING (public.is_church_owner(church_id));

-- 4. bible-imports bucket: explicit admin-only policies
CREATE POLICY "Admins can read bible-imports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'bible-imports' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload bible-imports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bible-imports' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bible-imports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'bible-imports' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bible-imports"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bible-imports' AND public.has_role(auth.uid(), 'admin'::app_role));
