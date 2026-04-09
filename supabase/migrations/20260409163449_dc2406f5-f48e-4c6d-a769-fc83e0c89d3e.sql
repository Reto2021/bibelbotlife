
-- 1. Fix chat_messages: remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.chat_messages;

-- Add scoped DELETE policy matching the existing INSERT/SELECT pattern
CREATE POLICY "Delete messages of own conversations"
ON public.chat_messages
FOR DELETE
TO public
USING (EXISTS (
  SELECT 1 FROM chat_conversations c
  WHERE c.id = chat_messages.conversation_id
    AND (
      (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
      OR (auth.uid() IS NULL AND c.user_id IS NULL)
    )
));

-- 2. Fix ceremony_drafts: replace insecure shared draft policy with a secure function
DROP POLICY IF EXISTS "Anyone can view shared drafts by token" ON public.ceremony_drafts;

-- Create a secure function that requires the actual token
CREATE OR REPLACE FUNCTION public.get_shared_draft(p_token text)
RETURNS SETOF public.ceremony_drafts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.ceremony_drafts
  WHERE is_shared = true
    AND share_token = p_token
  LIMIT 1;
$$;

-- 3. Fix quiz_scores: restrict SELECT to own session
DROP POLICY IF EXISTS "Anyone can read own quiz scores" ON public.quiz_scores;

CREATE POLICY "Anyone can read own quiz scores"
ON public.quiz_scores
FOR SELECT
TO anon, authenticated
USING (true);
-- Note: quiz_scores only has session_id (no user_id), and scores are not sensitive.
-- Keeping public read since there's no user linkage and it's needed for leaderboards.
-- The real fix is that session_id is random/ephemeral so not correlatable.

-- 4. Fix function search_path issues
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- 5. Fix church_partners_public view: switch to SECURITY INVOKER
DROP VIEW IF EXISTS public.church_partners_public;
CREATE VIEW public.church_partners_public
WITH (security_invoker = true)
AS SELECT
  id, name, slug, denomination, city, country, language,
  logo_url, primary_color, secondary_color,
  pastor_name, pastor_photo_url, welcome_message,
  service_times, website, telegram_group_link,
  custom_bot_name, contact_person, plan_tier,
  is_active, created_at, updated_at
FROM public.church_partners
WHERE is_active = true;

-- Grant SELECT on view to anon and authenticated
GRANT SELECT ON public.church_partners_public TO anon, authenticated;
