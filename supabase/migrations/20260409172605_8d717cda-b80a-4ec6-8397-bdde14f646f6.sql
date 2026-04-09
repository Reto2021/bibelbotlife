DROP POLICY IF EXISTS "Read own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Delete own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.chat_conversations;

CREATE POLICY "Users can read own conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
ON public.chat_conversations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Read messages of own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Insert messages into own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Delete messages of own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Update messages of own conversations" ON public.chat_messages;

CREATE POLICY "Users can read messages of own conversations"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages into own conversations"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages of own conversations"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages of own conversations"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);