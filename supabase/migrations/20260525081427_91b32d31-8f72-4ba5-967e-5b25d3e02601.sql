
DROP POLICY IF EXISTS "Church members can read service PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Church members can upload service PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Church members can update service PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Church members can delete service PDFs" ON storage.objects;

CREATE POLICY "Team members can read service PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-pdfs'
  AND public.is_church_team_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Team members can upload service PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-pdfs'
  AND public.is_church_team_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Team members can update service PDFs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'service-pdfs'
  AND public.is_church_team_member(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'service-pdfs'
  AND public.is_church_team_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Team members can delete service PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'service-pdfs'
  AND public.is_church_team_member(((storage.foldername(name))[1])::uuid)
);
