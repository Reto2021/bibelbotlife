CREATE TABLE public.widget_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  question_count integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (church_id, visitor_id)
);

CREATE INDEX idx_widget_usage_church ON public.widget_usage(church_id, last_seen_at DESC);

GRANT SELECT ON public.widget_usage TO authenticated;
GRANT ALL ON public.widget_usage TO service_role;

ALTER TABLE public.widget_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church team can view own widget usage"
  ON public.widget_usage FOR SELECT
  TO authenticated
  USING (public.is_church_team_member(church_id));

CREATE POLICY "Admins can view all widget usage"
  ON public.widget_usage FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.record_widget_question(_church_slug text, _visitor_id text)
RETURNS TABLE(question_count integer, plan_tier church_plan_tier, limit_exceeded boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _church_id uuid;
  _tier church_plan_tier;
  _count integer;
BEGIN
  SELECT id, cp.plan_tier INTO _church_id, _tier
  FROM public.church_partners cp
  WHERE cp.slug = _church_slug AND cp.is_active = true
  LIMIT 1;

  IF _church_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.widget_usage (church_id, visitor_id, question_count, first_seen_at, last_seen_at)
  VALUES (_church_id, _visitor_id, 1, now(), now())
  ON CONFLICT (church_id, visitor_id)
  DO UPDATE SET question_count = widget_usage.question_count + 1,
                last_seen_at = now()
  RETURNING widget_usage.question_count INTO _count;

  question_count := _count;
  plan_tier := _tier;
  limit_exceeded := (_tier = 'free'::church_plan_tier AND _count > 1);
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_widget_question(text, text) TO service_role;