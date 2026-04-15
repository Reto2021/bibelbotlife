
-- Add shared_with_church flag
ALTER TABLE public.resource_library
ADD COLUMN shared_with_church boolean NOT NULL DEFAULT false;

-- Policy: church team members can read resources shared with their church
CREATE POLICY "Church members can read shared resources"
ON public.resource_library
FOR SELECT
USING (
  shared_with_church = true
  AND church_id IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = resource_library.church_id
        AND cm.user_id = auth.uid()
    )
    OR is_church_owner(church_id)
  )
);
