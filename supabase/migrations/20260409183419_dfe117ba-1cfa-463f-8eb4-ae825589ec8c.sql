CREATE POLICY "Anyone can read quiz scores"
ON public.quiz_scores
FOR SELECT
TO anon, authenticated
USING (true);