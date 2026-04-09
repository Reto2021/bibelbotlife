-- 1. Add is_approved column
ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- 2. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read prayer requests" ON public.prayer_requests;

-- 3. Allow admins to update (approve/reject) prayer requests
CREATE POLICY "Admins can update prayer requests"
  ON public.prayer_requests
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Update the public prayers function to only return approved requests
CREATE OR REPLACE FUNCTION public.get_public_prayers()
  RETURNS TABLE(id uuid, content text, prayer_count integer, is_anonymous boolean, created_at timestamp with time zone)
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT id, content, prayer_count, is_anonymous, created_at
  FROM public.prayer_requests
  WHERE is_approved = true
  ORDER BY created_at DESC;
$function$;