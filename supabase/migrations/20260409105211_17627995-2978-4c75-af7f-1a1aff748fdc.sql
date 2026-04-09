-- Create storage bucket for shared service PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-pdfs', 'service-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload PDFs
CREATE POLICY "Authenticated users can upload service PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-pdfs');

-- Authenticated users can read their uploaded PDFs
CREATE POLICY "Authenticated users can read service PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-pdfs');
