
-- 1. Create tables FIRST (no policies yet)

CREATE TABLE public.circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  weekly_bible_book text,
  weekly_bible_chapter int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE public.circle_prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  content text NOT NULL,
  prayer_count int DEFAULT 0,
  is_answered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.circle_journey_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  days_completed int DEFAULT 0,
  last_active_date date,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- 2. Helper function (tables exist now)
CREATE OR REPLACE FUNCTION public.is_circle_member(_circle_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = _circle_id AND user_id = _user_id
  )
$$;

-- 3. Increment prayer count function
CREATE OR REPLACE FUNCTION public.increment_circle_prayer_count(request_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.circle_prayer_requests
  SET prayer_count = prayer_count + 1
  WHERE id = request_id;
$$;

-- 4. Validation triggers
CREATE OR REPLACE FUNCTION public.validate_circle()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(trim(COALESCE(NEW.name, ''))) < 1 OR length(NEW.name) > 50 THEN
    RAISE EXCEPTION 'Circle name must be 1-50 characters';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_circle
  BEFORE INSERT OR UPDATE ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.validate_circle();

CREATE OR REPLACE FUNCTION public.validate_circle_member()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE member_count int;
BEGIN
  IF length(trim(COALESCE(NEW.display_name, ''))) < 1 OR length(NEW.display_name) > 30 THEN
    RAISE EXCEPTION 'Display name must be 1-30 characters';
  END IF;
  SELECT count(*) INTO member_count FROM public.circle_members WHERE circle_id = NEW.circle_id;
  IF member_count >= 8 THEN
    RAISE EXCEPTION 'Circle is full (max 8 members)';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_circle_member
  BEFORE INSERT ON public.circle_members
  FOR EACH ROW EXECUTE FUNCTION public.validate_circle_member();

CREATE OR REPLACE FUNCTION public.validate_circle_prayer()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(trim(COALESCE(NEW.content, ''))) < 1 OR length(NEW.content) > 500 THEN
    RAISE EXCEPTION 'Prayer content must be 1-500 characters';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_circle_prayer
  BEFORE INSERT OR UPDATE ON public.circle_prayer_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_circle_prayer();

-- 5. Enable RLS
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_journey_progress ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — circles
CREATE POLICY "circle members can view"
  ON public.circles FOR SELECT
  USING (public.is_circle_member(id, auth.uid()));

CREATE POLICY "authenticated users can create circles"
  ON public.circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "creator can update circle"
  ON public.circles FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies — circle_members
CREATE POLICY "members can view other members"
  ON public.circle_members FOR SELECT
  USING (public.is_circle_member(circle_id, auth.uid()));

CREATE POLICY "users can join circles"
  ON public.circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can leave circles"
  ON public.circle_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies — circle_prayer_requests
CREATE POLICY "circle members can view prayers"
  ON public.circle_prayer_requests FOR SELECT
  USING (public.is_circle_member(circle_id, auth.uid()));

CREATE POLICY "circle members can add prayers"
  ON public.circle_prayer_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_circle_member(circle_id, auth.uid())
  );

CREATE POLICY "owner can update prayer"
  ON public.circle_prayer_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies — circle_journey_progress
CREATE POLICY "circle members can view progress"
  ON public.circle_journey_progress FOR SELECT
  USING (public.is_circle_member(circle_id, auth.uid()));

CREATE POLICY "users can insert own progress"
  ON public.circle_journey_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own progress"
  ON public.circle_journey_progress FOR UPDATE
  USING (auth.uid() = user_id);
