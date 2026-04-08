
-- Create enum for record types
CREATE TYPE public.record_type AS ENUM ('baptism', 'wedding', 'funeral');

-- Create church_records table
CREATE TABLE public.church_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  record_type public.record_type NOT NULL,
  record_date DATE NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  officiant TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  notes TEXT,
  record_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.church_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own records"
  ON public.church_records FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create records"
  ON public.church_records FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own records"
  ON public.church_records FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own records"
  ON public.church_records FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_church_records_updated_at
  BEFORE UPDATE ON public.church_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_church_records_church_id ON public.church_records(church_id);
CREATE INDEX idx_church_records_record_type ON public.church_records(record_type);
CREATE INDEX idx_church_records_record_date ON public.church_records(record_date);
