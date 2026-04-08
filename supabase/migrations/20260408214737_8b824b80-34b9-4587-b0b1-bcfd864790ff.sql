
-- Add owner_id to church_partners
ALTER TABLE public.church_partners ADD COLUMN owner_id UUID;

-- Index for fast lookup
CREATE INDEX idx_church_partners_owner ON public.church_partners(owner_id);

-- Policy: owner can update their own church
CREATE POLICY "Owner can update own church"
  ON public.church_partners FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy: authenticated users can insert (create) their own church
CREATE POLICY "Authenticated users can create church"
  ON public.church_partners FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
