INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('share-images', 'share-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for share images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'share-images');

CREATE POLICY "Service role can insert share images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'share-images');