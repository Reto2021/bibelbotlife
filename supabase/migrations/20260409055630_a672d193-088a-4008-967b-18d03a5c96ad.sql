
-- Prayer requests table
CREATE TABLE public.prayer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  author_name TEXT,
  prayer_count INTEGER NOT NULL DEFAULT 0,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prayer requests"
  ON public.prayer_requests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create prayer requests"
  ON public.prayer_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role manages prayer requests"
  ON public.prayer_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Quiz scores table
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  quiz_mode TEXT NOT NULL DEFAULT 'multiple_choice',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read own quiz scores"
  ON public.quiz_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert quiz scores"
  ON public.quiz_scores FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to increment prayer count atomically
CREATE OR REPLACE FUNCTION public.increment_prayer_count(request_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = request_id;
$$;
