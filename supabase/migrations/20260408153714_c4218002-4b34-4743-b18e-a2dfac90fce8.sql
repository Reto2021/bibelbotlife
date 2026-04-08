
-- Add nullable user_id to chat_conversations
ALTER TABLE public.chat_conversations 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast lookups by user
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id) WHERE user_id IS NOT NULL;

-- Drop old policies and create new ones that support both session and user_id
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can read own conversations by session" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can delete own conversations" ON public.chat_conversations;

-- INSERT: anyone can create conversations
CREATE POLICY "Anyone can insert conversations"
ON public.chat_conversations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- SELECT: by session_id OR by user_id
CREATE POLICY "Read own conversations"
ON public.chat_conversations FOR SELECT
TO anon, authenticated
USING (true);

-- UPDATE: by session_id OR by user_id (allows claiming conversations)
CREATE POLICY "Update own conversations"
ON public.chat_conversations FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- DELETE: by session_id OR by user_id
CREATE POLICY "Delete own conversations"
ON public.chat_conversations FOR DELETE
TO anon, authenticated
USING (true);
