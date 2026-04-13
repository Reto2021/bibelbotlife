
-- Church members: links users to churches via signup
CREATE TABLE public.church_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  consent_contact BOOLEAN NOT NULL DEFAULT false,
  source_slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, church_id)
);

ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.church_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own consent
CREATE POLICY "Users can update own consent"
  ON public.church_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Church owners can see members of their church
CREATE POLICY "Church owners can view church members"
  ON public.church_members FOR SELECT
  TO authenticated
  USING (is_church_owner(church_id));

-- Admins full access
CREATE POLICY "Admins can manage all church members"
  ON public.church_members FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Service role full access (for auto-assignment on signup)
CREATE POLICY "Service role manages church members"
  ON public.church_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own membership
CREATE POLICY "Users can create own membership"
  ON public.church_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- View that exposes contact details only for consented members
CREATE VIEW public.church_member_details
WITH (security_invoker = on) AS
  SELECT 
    cm.id,
    cm.church_id,
    cm.user_id,
    cm.consent_contact,
    cm.source_slug,
    cm.created_at,
    CASE WHEN cm.consent_contact THEN u.email ELSE NULL END AS email,
    CASE WHEN cm.consent_contact THEN u.raw_user_meta_data->>'full_name' ELSE NULL END AS full_name
  FROM public.church_members cm
  JOIN auth.users u ON u.id = cm.user_id;

-- Trigger for updated_at
CREATE TRIGGER update_church_members_updated_at
  BEFORE UPDATE ON public.church_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
