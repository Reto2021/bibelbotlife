
-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS: users can read own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 5. RLS: only service_role can manage roles
CREATE POLICY "Service role manages roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Security definer function to check roles (no RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. Admins can view ALL church_partners (including inactive)
CREATE POLICY "Admins can view all churches"
ON public.church_partners
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Admins can update any church
CREATE POLICY "Admins can update all churches"
ON public.church_partners
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Admins can read daily_subscribers
CREATE POLICY "Admins can read subscribers"
ON public.daily_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Admins can read analytics_events
CREATE POLICY "Admins can read analytics"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Admins can read church_contact_requests
CREATE POLICY "Admins can read contact requests"
ON public.church_contact_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 12. Admins can read church_partnership_inquiries
CREATE POLICY "Admins can read partnership inquiries"
ON public.church_partnership_inquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
