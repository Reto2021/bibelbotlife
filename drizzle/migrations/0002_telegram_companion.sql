CREATE TABLE public.telegram_chat_settings (
  chat_id BIGINT PRIMARY KEY,
  companion TEXT NOT NULL DEFAULT 'auto' CHECK (companion IN ('lea','jonas','auto')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_chat_settings TO service_role;
ALTER TABLE public.telegram_chat_settings ENABLE ROW LEVEL SECURITY;