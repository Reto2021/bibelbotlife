
-- 1. Fix chat_conversations policies
DROP POLICY IF EXISTS "Read own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Delete own conversations" ON public.chat_conversations;

-- SELECT: auth users see own rows; anon sees only anon rows
CREATE POLICY "Read own conversations" ON public.chat_conversations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- UPDATE: auth users update own; anon updates only anon rows
CREATE POLICY "Update own conversations" ON public.chat_conversations
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- DELETE: auth users delete own; anon deletes only anon rows
CREATE POLICY "Delete own conversations" ON public.chat_conversations
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- 2. Fix chat_messages – scope via conversation ownership
DROP POLICY IF EXISTS "Read messages of own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Insert messages into own conversations" ON public.chat_messages;

CREATE POLICY "Read messages of own conversations" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id
        AND (
          (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
          OR (auth.uid() IS NULL AND c.user_id IS NULL)
        )
    )
  );

CREATE POLICY "Insert messages into own conversations" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id
        AND (
          (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
          OR (auth.uid() IS NULL AND c.user_id IS NULL)
        )
    )
  );

-- 3. Tighten analytics_events INSERT with validation trigger
CREATE OR REPLACE FUNCTION public.validate_analytics_event()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $$
BEGIN
  -- Enforce allowed event types
  IF NEW.event_type NOT IN ('pageview', 'event') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  -- Limit field sizes
  IF length(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'session_id too long';
  END IF;
  IF NEW.event_name IS NOT NULL AND length(NEW.event_name) > 200 THEN
    RAISE EXCEPTION 'event_name too long';
  END IF;
  IF NEW.event_data IS NOT NULL AND octet_length(NEW.event_data::text) > 4096 THEN
    RAISE EXCEPTION 'event_data too large';
  END IF;
  IF NEW.user_agent IS NOT NULL AND length(NEW.user_agent) > 500 THEN
    NEW.user_agent := left(NEW.user_agent, 500);
  END IF;
  IF NEW.referrer IS NOT NULL AND length(NEW.referrer) > 2000 THEN
    NEW.referrer := left(NEW.referrer, 2000);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_analytics_event
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_analytics_event();

-- 4. Fix service-pdfs storage policies with church ownership check
DROP POLICY IF EXISTS "Authenticated users can upload service PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read service PDFs" ON storage.objects;

CREATE POLICY "Church members can upload service PDFs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'service-pdfs'
    AND (storage.foldername(name))[1] IN (
      SELECT cp.id::text FROM public.church_partners cp WHERE cp.owner_id = auth.uid()
    )
  );

CREATE POLICY "Church members can read service PDFs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'service-pdfs'
    AND (storage.foldername(name))[1] IN (
      SELECT cp.id::text FROM public.church_partners cp WHERE cp.owner_id = auth.uid()
    )
  );
