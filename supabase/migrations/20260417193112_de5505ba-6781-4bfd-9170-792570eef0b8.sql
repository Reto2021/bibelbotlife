-- Chat feedback table
CREATE TABLE public.chat_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  comment TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_chat_feedback_unreviewed ON public.chat_feedback(created_at DESC) WHERE rating = -1 AND reviewed = false;
CREATE INDEX idx_chat_feedback_message ON public.chat_feedback(message_id);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.chat_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback" ON public.chat_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own feedback" ON public.chat_feedback
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback" ON public.chat_feedback
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all feedback" ON public.chat_feedback
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages feedback" ON public.chat_feedback
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Golden answers table (curated Q&A pairs that improve future responses)
CREATE TABLE public.golden_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'de',
  topic TEXT,
  source_feedback_id UUID REFERENCES public.chat_feedback(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  embedding extensions.vector(384),
  is_active BOOLEAN NOT NULL DEFAULT true,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_golden_answers_active ON public.golden_answers(language, is_active) WHERE is_active = true;
CREATE INDEX idx_golden_answers_embedding ON public.golden_answers USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.golden_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active golden answers" ON public.golden_answers
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins manage golden answers" ON public.golden_answers
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages golden answers" ON public.golden_answers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_golden_answers_updated_at
  BEFORE UPDATE ON public.golden_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Search function for golden answers (similar to search_theology)
CREATE OR REPLACE FUNCTION public.search_golden_answers(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.75,
  match_count integer DEFAULT 3,
  language_filter text DEFAULT 'de'
)
RETURNS TABLE(id uuid, question text, answer text, topic text, similarity double precision)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ga.id, ga.question, ga.answer, ga.topic,
    1 - (ga.embedding <=> query_embedding) AS similarity
  FROM public.golden_answers ga
  WHERE
    ga.is_active = true
    AND ga.embedding IS NOT NULL
    AND ga.language = language_filter
    AND 1 - (ga.embedding <=> query_embedding) > match_threshold
  ORDER BY ga.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Increment use count helper
CREATE OR REPLACE FUNCTION public.increment_golden_answer_use(answer_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.golden_answers SET use_count = use_count + 1 WHERE id = answer_id;
$$;