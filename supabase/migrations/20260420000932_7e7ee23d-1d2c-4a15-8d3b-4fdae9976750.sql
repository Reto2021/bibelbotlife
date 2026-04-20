
-- 1. Add invitation tracking to team members
ALTER TABLE public.service_team_members
  ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_team_members_email_lower
  ON public.service_team_members ((lower(email)))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_user_id
  ON public.service_team_members (user_id)
  WHERE user_id IS NOT NULL;

-- 2. Security-definer helper: is the current user a member (owner or active team member) of a given church?
CREATE OR REPLACE FUNCTION public.is_church_team_member(_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_partners cp
    WHERE cp.id = _church_id AND cp.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.service_team_members tm
    WHERE tm.church_id = _church_id
      AND tm.user_id = auth.uid()
      AND tm.is_active = true
  );
$$;

-- 3. Helper: list churches the current user belongs to (owner or team member)
CREATE OR REPLACE FUNCTION public.get_my_team_churches()
RETURNS TABLE(church_id uuid, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id, 'owner'::text
  FROM public.church_partners cp
  WHERE cp.owner_id = auth.uid()
  UNION
  SELECT tm.church_id, tm.role::text
  FROM public.service_team_members tm
  WHERE tm.user_id = auth.uid() AND tm.is_active = true;
$$;

-- 4. Trigger: when a new auth user signs up, link any pending team invitations by email
CREATE OR REPLACE FUNCTION public.link_team_invitations_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.service_team_members
       SET user_id = NEW.id,
           accepted_at = COALESCE(accepted_at, now())
     WHERE user_id IS NULL
       AND lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_team_invites_on_user_create ON auth.users;
CREATE TRIGGER link_team_invites_on_user_create
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_team_invitations_on_signup();

-- 5. Backfill: link existing users to existing pending team rows by email match
UPDATE public.service_team_members tm
   SET user_id = u.id,
       accepted_at = COALESCE(tm.accepted_at, now())
  FROM auth.users u
 WHERE tm.user_id IS NULL
   AND tm.email IS NOT NULL
   AND lower(tm.email) = lower(u.email);

-- 6. Replace RLS policies — services
DROP POLICY IF EXISTS "Users can view services of their church" ON public.services;
DROP POLICY IF EXISTS "Users can create services" ON public.services;
DROP POLICY IF EXISTS "Users can update their services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their services" ON public.services;

CREATE POLICY "Team members can view services"
ON public.services FOR SELECT TO authenticated
USING (public.is_church_team_member(church_id));

CREATE POLICY "Team members can create services"
ON public.services FOR INSERT TO authenticated
WITH CHECK (public.is_church_team_member(church_id) AND created_by = auth.uid());

CREATE POLICY "Team members can update services"
ON public.services FOR UPDATE TO authenticated
USING (public.is_church_team_member(church_id))
WITH CHECK (public.is_church_team_member(church_id));

CREATE POLICY "Team members can delete services"
ON public.services FOR DELETE TO authenticated
USING (public.is_church_team_member(church_id));

-- 7. service_templates
DROP POLICY IF EXISTS "Users can view own templates or defaults" ON public.service_templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.service_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.service_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.service_templates;

CREATE POLICY "Team members can view templates or defaults"
ON public.service_templates FOR SELECT TO authenticated
USING (
  is_default = true
  OR (church_id IS NOT NULL AND public.is_church_team_member(church_id))
  OR (church_id IS NULL AND created_by = auth.uid())
);

CREATE POLICY "Team members can create templates"
ON public.service_templates FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (church_id IS NULL OR public.is_church_team_member(church_id))
);

CREATE POLICY "Team members can update templates"
ON public.service_templates FOR UPDATE TO authenticated
USING (
  (church_id IS NOT NULL AND public.is_church_team_member(church_id))
  OR (church_id IS NULL AND created_by = auth.uid())
);

CREATE POLICY "Team members can delete templates"
ON public.service_templates FOR DELETE TO authenticated
USING (
  (church_id IS NOT NULL AND public.is_church_team_member(church_id))
  OR (church_id IS NULL AND created_by = auth.uid())
);

-- 8. service_series
DROP POLICY IF EXISTS "Users can view own series" ON public.service_series;
DROP POLICY IF EXISTS "Users can create series" ON public.service_series;
DROP POLICY IF EXISTS "Users can update own series" ON public.service_series;
DROP POLICY IF EXISTS "Users can delete own series" ON public.service_series;

CREATE POLICY "Team members can view series"
ON public.service_series FOR SELECT TO authenticated
USING (
  (church_id IS NOT NULL AND public.is_church_team_member(church_id))
  OR (church_id IS NULL AND created_by = auth.uid())
);

CREATE POLICY "Team members can create series"
ON public.service_series FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (church_id IS NULL OR public.is_church_team_member(church_id))
);

CREATE POLICY "Team members can update series"
ON public.service_series FOR UPDATE TO authenticated
USING (
  (church_id IS NOT NULL AND public.is_church_team_member(church_id))
  OR (church_id IS NULL AND created_by = auth.uid())
);

CREATE POLICY "Team members can delete series"
ON public.service_series FOR DELETE TO authenticated
USING (
  (church_id IS NOT NULL AND public.is_church_team_member(church_id))
  OR (church_id IS NULL AND created_by = auth.uid())
);

-- 9. church_records
DROP POLICY IF EXISTS "Users can view own records" ON public.church_records;
DROP POLICY IF EXISTS "Users can create records" ON public.church_records;
DROP POLICY IF EXISTS "Users can update own records" ON public.church_records;
DROP POLICY IF EXISTS "Users can delete own records" ON public.church_records;

CREATE POLICY "Team members can view records"
ON public.church_records FOR SELECT TO authenticated
USING (public.is_church_team_member(church_id));

CREATE POLICY "Team members can create records"
ON public.church_records FOR INSERT TO authenticated
WITH CHECK (public.is_church_team_member(church_id) AND created_by = auth.uid());

CREATE POLICY "Team members can update records"
ON public.church_records FOR UPDATE TO authenticated
USING (public.is_church_team_member(church_id))
WITH CHECK (public.is_church_team_member(church_id));

CREATE POLICY "Team members can delete records"
ON public.church_records FOR DELETE TO authenticated
USING (public.is_church_team_member(church_id));

-- 10. service_team_members itself: owner manages, members can view roster
DROP POLICY IF EXISTS "Users can view own team members" ON public.service_team_members;
DROP POLICY IF EXISTS "Users can create team members" ON public.service_team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON public.service_team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON public.service_team_members;

CREATE POLICY "Team members can view roster"
ON public.service_team_members FOR SELECT TO authenticated
USING (public.is_church_team_member(church_id));

CREATE POLICY "Owner can add team members"
ON public.service_team_members FOR INSERT TO authenticated
WITH CHECK (public.is_church_owner(church_id) AND created_by = auth.uid());

CREATE POLICY "Owner can update team members"
ON public.service_team_members FOR UPDATE TO authenticated
USING (public.is_church_owner(church_id))
WITH CHECK (public.is_church_owner(church_id));

CREATE POLICY "Owner can delete team members"
ON public.service_team_members FOR DELETE TO authenticated
USING (public.is_church_owner(church_id));

-- Self-update so an invited member can accept (set accepted_at) — covered by trigger,
-- but allow members to mark themselves inactive (leave team)
CREATE POLICY "Members can leave team"
ON public.service_team_members FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 11. invoices: team members can view (only owner & admin can mutate, already covered)
CREATE POLICY "Team members can view invoices"
ON public.invoices FOR SELECT TO authenticated
USING (public.is_church_team_member(church_id));

-- 12. resource_library: team members can read shared church resources
DROP POLICY IF EXISTS "Church members can read shared resources" ON public.resource_library;
CREATE POLICY "Church team can read shared resources"
ON public.resource_library FOR SELECT TO authenticated
USING (
  shared_with_church = true
  AND church_id IS NOT NULL
  AND public.is_church_team_member(church_id)
);
