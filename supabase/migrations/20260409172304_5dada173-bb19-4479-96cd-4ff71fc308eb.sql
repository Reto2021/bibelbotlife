DROP POLICY IF EXISTS "Service role manages telegram messages" ON public.telegram_messages;
CREATE POLICY "Service role manages telegram messages"
ON public.telegram_messages
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages telegram bot state" ON public.telegram_bot_state;
CREATE POLICY "Service role manages telegram bot state"
ON public.telegram_bot_state
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can read broadcast log" ON public.daily_broadcast_log;
CREATE POLICY "Admins can read broadcast log"
ON public.daily_broadcast_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages broadcast log" ON public.daily_broadcast_log;
CREATE POLICY "Service role manages broadcast log"
ON public.daily_broadcast_log
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can read own quiz scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "Service role can read quiz scores" ON public.quiz_scores;
CREATE POLICY "Service role can read quiz scores"
ON public.quiz_scores
FOR SELECT
TO service_role
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update invoice PDFs" ON storage.objects;
CREATE POLICY "Admins can update invoice PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING ((bucket_id = 'invoices') AND public.has_role(auth.uid(), 'admin'))
WITH CHECK ((bucket_id = 'invoices') AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete invoice PDFs" ON storage.objects;
CREATE POLICY "Admins can delete invoice PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING ((bucket_id = 'invoices') AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Church owners can update own invoice PDFs" ON storage.objects;
CREATE POLICY "Church owners can update own invoice PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = 'invoices')
  AND ((storage.foldername(name))[1] IN (
    SELECT cp.id::text
    FROM public.church_partners cp
    WHERE cp.owner_id = auth.uid()
  ))
)
WITH CHECK (
  (bucket_id = 'invoices')
  AND ((storage.foldername(name))[1] IN (
    SELECT cp.id::text
    FROM public.church_partners cp
    WHERE cp.owner_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Church owners can delete own invoice PDFs" ON storage.objects;
CREATE POLICY "Church owners can delete own invoice PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = 'invoices')
  AND ((storage.foldername(name))[1] IN (
    SELECT cp.id::text
    FROM public.church_partners cp
    WHERE cp.owner_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Church members can update service PDFs" ON storage.objects;
CREATE POLICY "Church members can update service PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = 'service-pdfs')
  AND ((storage.foldername(name))[1] IN (
    SELECT cp.id::text
    FROM public.church_partners cp
    WHERE cp.owner_id = auth.uid()
  ))
)
WITH CHECK (
  (bucket_id = 'service-pdfs')
  AND ((storage.foldername(name))[1] IN (
    SELECT cp.id::text
    FROM public.church_partners cp
    WHERE cp.owner_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Church members can delete service PDFs" ON storage.objects;
CREATE POLICY "Church members can delete service PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = 'service-pdfs')
  AND ((storage.foldername(name))[1] IN (
    SELECT cp.id::text
    FROM public.church_partners cp
    WHERE cp.owner_id = auth.uid()
  ))
);