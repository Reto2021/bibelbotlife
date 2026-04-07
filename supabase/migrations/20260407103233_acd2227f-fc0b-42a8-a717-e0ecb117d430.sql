-- Table for daily impulse subscribers
CREATE TABLE public.daily_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('push', 'telegram', 'sms')),
  -- push: JSON push subscription object
  push_subscription JSONB,
  -- telegram: chat_id
  telegram_chat_id BIGINT,
  -- sms: phone number
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_subscribers_channel ON public.daily_subscribers (channel);
CREATE INDEX idx_daily_subscribers_active ON public.daily_subscribers (is_active) WHERE is_active = true;

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX idx_daily_subscribers_telegram ON public.daily_subscribers (telegram_chat_id) WHERE channel = 'telegram' AND is_active = true;
CREATE UNIQUE INDEX idx_daily_subscribers_phone ON public.daily_subscribers (phone_number) WHERE channel = 'sms' AND is_active = true;

-- RLS
ALTER TABLE public.daily_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe"
  ON public.daily_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public reads
CREATE POLICY "No public reads on subscribers"
  ON public.daily_subscribers
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- Table for sent broadcast log
CREATE TABLE public.daily_broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impulse_date DATE NOT NULL UNIQUE,
  impulse_data JSONB NOT NULL,
  subscribers_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_broadcast_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access on broadcast log"
  ON public.daily_broadcast_log
  FOR ALL
  TO anon, authenticated
  USING (false);