DROP POLICY IF EXISTS "Anyone can upload cross photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can submit a cross post" ON public.cross_posts;
GRANT ALL ON public.cross_posts TO service_role;