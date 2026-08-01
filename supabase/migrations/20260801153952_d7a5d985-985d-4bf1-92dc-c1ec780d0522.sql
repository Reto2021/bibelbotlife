ALTER TABLE public.cross_posts
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS cross_posts_session_id_idx ON public.cross_posts (session_id);
CREATE INDEX IF NOT EXISTS cross_posts_user_id_idx ON public.cross_posts (user_id);

DROP TRIGGER IF EXISTS cross_posts_set_updated_at ON public.cross_posts;
CREATE TRIGGER cross_posts_set_updated_at
  BEFORE UPDATE ON public.cross_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();