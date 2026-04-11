
CREATE TABLE public.pipeline_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  cron_expression text NOT NULL DEFAULT '0 9 * * 1-5',
  search_query text NOT NULL,
  country text NOT NULL DEFAULT 'ch',
  max_results integer NOT NULL DEFAULT 10,
  last_run_at timestamptz,
  last_run_status text,
  last_run_log text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id)
);

ALTER TABLE public.pipeline_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pipeline schedules"
ON public.pipeline_schedules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_pipeline_schedules_updated_at
  BEFORE UPDATE ON public.pipeline_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
