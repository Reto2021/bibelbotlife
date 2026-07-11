CREATE TABLE public.user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) <= 20000),
  source text NOT NULL CHECK (source IN ('gpt','claude','gemini','manual')),
  is_active boolean NOT NULL DEFAULT true,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory TO authenticated;
GRANT ALL ON public.user_memory TO service_role;

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_memory_select" ON public.user_memory
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_memory_insert" ON public.user_memory
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_memory_update" ON public.user_memory
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_memory_delete" ON public.user_memory
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_user_memory_updated_at
  BEFORE UPDATE ON public.user_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_memory_user_active ON public.user_memory (user_id, is_active);

-- Extend bible_moment_trigger enum with new contextual triggers
ALTER TYPE bible_moment_trigger ADD VALUE IF NOT EXISTS 'calendar';
ALTER TYPE bible_moment_trigger ADD VALUE IF NOT EXISTS 'journal_mood';
ALTER TYPE bible_moment_trigger ADD VALUE IF NOT EXISTS 'memory_topic';