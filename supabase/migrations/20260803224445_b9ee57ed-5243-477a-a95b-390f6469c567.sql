DROP POLICY IF EXISTS "Anyone can read quiz scores" ON public.quiz_scores;

CREATE POLICY "Admins can read quiz scores"
ON public.quiz_scores
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_quiz_highscores(p_min_questions integer DEFAULT 5, p_limit integer DEFAULT 10)
RETURNS TABLE(score integer, total_questions integer, quiz_mode text, difficulty text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qs.score, qs.total_questions, qs.quiz_mode, qs.difficulty, qs.created_at
  FROM public.quiz_scores qs
  WHERE qs.total_questions >= GREATEST(COALESCE(p_min_questions, 5), 1)
  ORDER BY qs.score DESC, qs.created_at ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_highscores(integer, integer) TO anon, authenticated;