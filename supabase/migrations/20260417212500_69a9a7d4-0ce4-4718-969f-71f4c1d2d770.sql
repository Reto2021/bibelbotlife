CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  prompt text,
  verse_ref text,
  mood text CHECK (mood IN ('dankbar','hoffnungsvoll','schwer','suchend','friedvoll','unklar')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users create own entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users delete own entries" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Validate content length
CREATE OR REPLACE FUNCTION public.validate_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(trim(COALESCE(NEW.content, ''))) < 1 OR length(NEW.content) > 10000 THEN
    RAISE EXCEPTION 'Journal entry must be 1-10000 characters';
  END IF;
  IF NEW.prompt IS NOT NULL AND length(NEW.prompt) > 500 THEN
    RAISE EXCEPTION 'Prompt too long';
  END IF;
  IF NEW.verse_ref IS NOT NULL AND length(NEW.verse_ref) > 100 THEN
    RAISE EXCEPTION 'verse_ref too long';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_journal_entry_trigger
  BEFORE INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_journal_entry();

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created
  ON public.journal_entries (user_id, created_at DESC);