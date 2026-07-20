
-- 1) circle_prayer_requests: add WITH CHECK to owner update policy
DROP POLICY IF EXISTS "owner can update prayer" ON public.circle_prayer_requests;
CREATE POLICY "owner can update prayer"
ON public.circle_prayer_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND public.is_circle_member(circle_id, auth.uid()));

-- 2) service_team_members: prevent members from escalating their own role
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If the updater is the row's user (self-update) and is NOT the church owner,
  -- disallow changes to role, church_id, user_id, or is_active=true escalation.
  IF auth.uid() = NEW.user_id AND NOT public.is_church_owner(NEW.church_id) THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Members cannot change their own role';
    END IF;
    IF NEW.church_id IS DISTINCT FROM OLD.church_id THEN
      RAISE EXCEPTION 'Members cannot change church_id';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Members cannot change user_id';
    END IF;
    -- Members may set is_active=false (leave) but not reactivate themselves
    IF OLD.is_active = false AND NEW.is_active = true THEN
      RAISE EXCEPTION 'Members cannot reactivate themselves';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_team_members_prevent_escalation ON public.service_team_members;
CREATE TRIGGER trg_service_team_members_prevent_escalation
BEFORE UPDATE ON public.service_team_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();
