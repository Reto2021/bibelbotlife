-- Drop the strict FK and uniqueness — make feedback work for both DB-persisted and local chats
ALTER TABLE public.chat_feedback DROP CONSTRAINT IF EXISTS chat_feedback_message_id_fkey;
ALTER TABLE public.chat_feedback DROP CONSTRAINT IF EXISTS chat_feedback_conversation_id_fkey;
ALTER TABLE public.chat_feedback DROP CONSTRAINT IF EXISTS chat_feedback_message_id_user_id_key;

ALTER TABLE public.chat_feedback ALTER COLUMN message_id DROP NOT NULL;
ALTER TABLE public.chat_feedback ALTER COLUMN conversation_id DROP NOT NULL;
ALTER TABLE public.chat_feedback ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.chat_feedback ADD COLUMN IF NOT EXISTS question_text TEXT;
ALTER TABLE public.chat_feedback ADD COLUMN IF NOT EXISTS answer_text TEXT;
ALTER TABLE public.chat_feedback ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de';
ALTER TABLE public.chat_feedback ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_feedback_session ON public.chat_feedback(session_id);

-- Allow anonymous feedback inserts
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.chat_feedback;
CREATE POLICY "Anyone can insert feedback" ON public.chat_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Either authenticated and user_id matches, or anonymous with session_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
  );

-- Allow updating own feedback (e.g. switching rating, adding comment)
DROP POLICY IF EXISTS "Users can update own feedback" ON public.chat_feedback;
CREATE POLICY "Users can update own feedback" ON public.chat_feedback
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());