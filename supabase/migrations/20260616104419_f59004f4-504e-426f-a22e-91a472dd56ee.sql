CREATE TABLE public.email_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  resend_email_id text,
  event_type text NOT NULL,
  recipient_email text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_tracking_events TO authenticated;
GRANT ALL ON public.email_tracking_events TO service_role;

ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tracking events"
  ON public.email_tracking_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_tracking_message_id ON public.email_tracking_events(message_id);
CREATE INDEX idx_email_tracking_resend_id ON public.email_tracking_events(resend_email_id);
CREATE INDEX idx_email_tracking_event_type ON public.email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_occurred_at ON public.email_tracking_events(occurred_at DESC);

CREATE UNIQUE INDEX idx_email_tracking_unique
  ON public.email_tracking_events(resend_email_id, event_type)
  WHERE resend_email_id IS NOT NULL;
