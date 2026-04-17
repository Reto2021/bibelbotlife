CREATE TABLE IF NOT EXISTS public.social_posts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  topic text,
  reference text,
  platforms text[],
  results jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_log_date
  ON public.social_posts_log(date DESC);

ALTER TABLE public.social_posts_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs; service role bypasses RLS automatically
CREATE POLICY "Admins can view social_posts_log"
  ON public.social_posts_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));