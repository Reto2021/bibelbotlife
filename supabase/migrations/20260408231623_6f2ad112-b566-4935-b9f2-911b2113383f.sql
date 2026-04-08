
-- Create enum for ceremony types
CREATE TYPE public.ceremony_type AS ENUM ('funeral', 'wedding', 'baptism', 'confirmation');

-- Create ceremony drafts table
CREATE TABLE public.ceremony_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ceremony_type public.ceremony_type NOT NULL DEFAULT 'funeral',
  person_name TEXT,
  form_data JSONB DEFAULT '{}'::jsonb,
  transcripts JSONB DEFAULT '[]'::jsonb,
  generated_text TEXT,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceremony_drafts ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with own drafts
CREATE POLICY "Users can view own drafts"
ON public.ceremony_drafts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create drafts"
ON public.ceremony_drafts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drafts"
ON public.ceremony_drafts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own drafts"
ON public.ceremony_drafts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Public read access via share token (for pastors viewing shared drafts)
CREATE POLICY "Anyone can view shared drafts by token"
ON public.ceremony_drafts FOR SELECT
TO anon, authenticated
USING (is_shared = true AND share_token IS NOT NULL);

-- Updated_at trigger
CREATE TRIGGER update_ceremony_drafts_updated_at
BEFORE UPDATE ON public.ceremony_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
