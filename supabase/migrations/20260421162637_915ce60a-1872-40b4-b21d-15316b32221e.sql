-- 1) Revoke all direct privileges from public/anon/authenticated
REVOKE ALL ON TABLE public.bible_verses_restricted FROM PUBLIC;
REVOKE ALL ON TABLE public.bible_verses_restricted FROM anon;
REVOKE ALL ON TABLE public.bible_verses_restricted FROM authenticated;

-- 2) Force RLS so even the table owner cannot bypass policies
ALTER TABLE public.bible_verses_restricted FORCE ROW LEVEL SECURITY;

-- 3) Add a RESTRICTIVE policy as a safety net:
--    Restrictive policies are AND-combined with permissive ones, so even if
--    someone later adds a permissive SELECT policy for anon/authenticated,
--    this restrictive one will still deny them.
DROP POLICY IF EXISTS "Restrict restricted bible to service role only" ON public.bible_verses_restricted;
CREATE POLICY "Restrict restricted bible to service role only"
ON public.bible_verses_restricted
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4) Revoke default privileges that future grants might inherit
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
-- Re-grant safe defaults for the rest of the schema (mirrors Supabase defaults)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES TO anon;

-- 5) Re-revoke specifically on our protected table (must come AFTER step 4)
REVOKE ALL ON TABLE public.bible_verses_restricted FROM anon;
REVOKE ALL ON TABLE public.bible_verses_restricted FROM authenticated;
REVOKE ALL ON TABLE public.bible_verses_restricted FROM PUBLIC;