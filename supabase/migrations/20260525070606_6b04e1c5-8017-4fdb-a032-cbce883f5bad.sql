DROP POLICY IF EXISTS "users can insert own progress" ON public.circle_journey_progress;
CREATE POLICY "users can insert own progress" ON public.circle_journey_progress
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id, auth.uid()));

DROP POLICY IF EXISTS "users can update own progress" ON public.circle_journey_progress;
CREATE POLICY "users can update own progress" ON public.circle_journey_progress
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.is_circle_member(circle_id, auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id, auth.uid()));