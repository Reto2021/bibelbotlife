ALTER TABLE public.church_partners
  ADD COLUMN IF NOT EXISTS custom_bot_name text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS secondary_color text;