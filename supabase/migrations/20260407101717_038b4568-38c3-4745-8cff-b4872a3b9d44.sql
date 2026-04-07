
-- Singleton table to track the getUpdates offset
CREATE TABLE public.telegram_bot_state (
  id int PRIMARY KEY CHECK (id = 1),
  update_offset bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

-- Table for storing incoming messages
CREATE TABLE public.telegram_messages (
  update_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  text text,
  raw_update jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages (chat_id);

-- RLS: telegram_bot_state only accessible by service_role
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

-- RLS: telegram_messages readable by service_role only
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
