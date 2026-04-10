CREATE POLICY "Church owners can read own church"
ON public.church_partners
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());