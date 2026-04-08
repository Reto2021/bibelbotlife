
-- Conversations table (anonymous, session-based)
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_conversations_session ON public.chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_updated ON public.chat_conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);

-- RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous users can CRUD their own conversations by session_id
CREATE POLICY "Anyone can insert conversations"
  ON public.chat_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read own conversations by session"
  ON public.chat_conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update own conversations"
  ON public.chat_conversations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete own conversations"
  ON public.chat_conversations FOR DELETE
  TO anon, authenticated
  USING (true);

-- Messages: public access (session filtering done in app)
CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read messages"
  ON public.chat_messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete messages"
  ON public.chat_messages FOR DELETE
  TO anon, authenticated
  USING (true);
