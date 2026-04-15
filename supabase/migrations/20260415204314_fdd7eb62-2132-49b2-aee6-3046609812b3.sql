
-- Add attachment columns to resource_library
ALTER TABLE public.resource_library
ADD COLUMN attachment_url text,
ADD COLUMN attachment_name text;

-- Create storage bucket for resource attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-attachments',
  'resource-attachments',
  false,
  20971520, -- 20MB
  ARRAY['application/pdf','audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/x-m4a','image/png','image/jpeg','image/webp']
);

-- Upload policy: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own resource attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resource-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read policy: users can read own files
CREATE POLICY "Users can read own resource attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resource-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete policy: users can delete own files
CREATE POLICY "Users can delete own resource attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resource-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all attachments
CREATE POLICY "Admins can manage resource attachments"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'resource-attachments'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'resource-attachments'
  AND public.has_role(auth.uid(), 'admin')
);
