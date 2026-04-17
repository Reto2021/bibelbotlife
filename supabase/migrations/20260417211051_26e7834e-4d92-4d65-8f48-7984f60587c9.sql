-- Add description to circles
ALTER TABLE public.circles
  ADD COLUMN IF NOT EXISTS description text;

-- Add role to circle_members
ALTER TABLE public.circle_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin','member'));

-- Add question_id + response tracking to circle_journey_progress
ALTER TABLE public.circle_journey_progress
  ADD COLUMN IF NOT EXISTS question_id text,
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT now();

-- Unique constraint for per-question progress (only when question_id is set)
CREATE UNIQUE INDEX IF NOT EXISTS circle_journey_progress_question_unique
  ON public.circle_journey_progress (circle_id, user_id, question_id)
  WHERE question_id IS NOT NULL;