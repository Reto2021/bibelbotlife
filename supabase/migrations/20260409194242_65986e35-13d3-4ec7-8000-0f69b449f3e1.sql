-- 1. Fix prayer_requests: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view prayer requests" ON public.prayer_requests;
CREATE POLICY "Authenticated users can view prayer requests"
ON public.prayer_requests
FOR SELECT
TO authenticated
USING (true);

-- Keep anon INSERT for submitting prayers (already exists), but no anon SELECT

-- 2. Fix user_roles: explicitly deny all non-service-role mutations
-- Drop any existing permissive policies for authenticated on user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

-- Allow users to read only their own role
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly block INSERT/UPDATE/DELETE for authenticated users
-- (Only service_role should manage roles)
CREATE POLICY "No authenticated insert on user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No authenticated update on user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No authenticated delete on user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);