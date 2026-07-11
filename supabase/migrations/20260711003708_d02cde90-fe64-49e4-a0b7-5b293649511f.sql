-- Enum for trigger types
DO $$ BEGIN
  CREATE TYPE public.bible_moment_trigger AS ENUM ('time','location','mood','weather','event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. bible_moments
CREATE TABLE public.bible_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type public.bible_moment_trigger NOT NULL,
  label TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_channel TEXT NOT NULL DEFAULT 'inapp' CHECK (delivery_channel IN ('push','inapp','sms','telegram','email')),
  language TEXT NOT NULL DEFAULT 'de',
  quiet_hours_start SMALLINT NOT NULL DEFAULT 22 CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end SMALLINT NOT NULL DEFAULT 7 CHECK (quiet_hours_end BETWEEN 0 AND 23),
  active BOOLEAN NOT NULL DEFAULT true,
  last_delivered_at TIMESTAMPTZ,
  next_eligible_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bible_moments_user_idx ON public.bible_moments(user_id);
CREATE INDEX bible_moments_dispatch_idx ON public.bible_moments(active, next_eligible_at) WHERE active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_moments TO authenticated;
GRANT ALL ON public.bible_moments TO service_role;

ALTER TABLE public.bible_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moments_own_select" ON public.bible_moments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "moments_own_insert" ON public.bible_moments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_own_update" ON public.bible_moments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moments_own_delete" ON public.bible_moments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. bible_moment_deliveries (log)
CREATE TABLE public.bible_moment_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.bible_moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped','read')),
  reference TEXT,
  translation TEXT,
  verse_text TEXT,
  impulse_text TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bible_moment_deliveries_user_idx ON public.bible_moment_deliveries(user_id, created_at DESC);
CREATE INDEX bible_moment_deliveries_moment_idx ON public.bible_moment_deliveries(moment_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.bible_moment_deliveries TO authenticated;
GRANT ALL ON public.bible_moment_deliveries TO service_role;

ALTER TABLE public.bible_moment_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliveries_own_select" ON public.bible_moment_deliveries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "deliveries_own_update_read" ON public.bible_moment_deliveries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger (reuse existing helper if present)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS bible_moments_touch ON public.bible_moments;
CREATE TRIGGER bible_moments_touch
  BEFORE UPDATE ON public.bible_moments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();