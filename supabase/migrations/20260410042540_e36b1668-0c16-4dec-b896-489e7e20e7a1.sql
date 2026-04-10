
-- Drop old get_shared_draft (return type changed)
DROP FUNCTION IF EXISTS public.get_shared_draft(text);

-- Recreate with minimal return fields
CREATE OR REPLACE FUNCTION public.get_shared_draft(p_token text)
RETURNS TABLE(
  ceremony_type ceremony_type,
  person_name text,
  generated_text text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ceremony_type, person_name, generated_text, created_at
  FROM public.ceremony_drafts
  WHERE is_shared = true AND share_token = p_token
  LIMIT 1;
$$;

-- Harden increment_prayer_count
CREATE OR REPLACE FUNCTION public.increment_prayer_count(request_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE prayer_requests
  SET prayer_count = prayer_count + 1
  WHERE id = request_id AND is_approved = true;
$$;

-- Validation trigger for prayer_requests
CREATE OR REPLACE FUNCTION public.validate_prayer_request()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(trim(NEW.content)) < 1 OR length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'content must be 1-2000 characters';
  END IF;
  IF length(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'session_id too long';
  END IF;
  IF NEW.author_name IS NOT NULL AND length(NEW.author_name) > 100 THEN
    RAISE EXCEPTION 'author_name too long';
  END IF;
  NEW.is_approved := false;
  NEW.prayer_count := 0;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_prayer_request ON public.prayer_requests;
CREATE TRIGGER trg_validate_prayer_request
  BEFORE INSERT ON public.prayer_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_prayer_request();

-- Validation trigger for quiz_scores
CREATE OR REPLACE FUNCTION public.validate_quiz_score()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(NEW.session_id) > 100 THEN RAISE EXCEPTION 'session_id too long'; END IF;
  IF NEW.score < 0 OR NEW.score > 1000 THEN RAISE EXCEPTION 'score out of range'; END IF;
  IF NEW.total_questions < 1 OR NEW.total_questions > 100 THEN RAISE EXCEPTION 'total_questions out of range'; END IF;
  IF NEW.difficulty NOT IN ('easy','medium','hard') THEN RAISE EXCEPTION 'invalid difficulty'; END IF;
  IF NEW.quiz_mode NOT IN ('multiple_choice','true_false','fill_blank') THEN RAISE EXCEPTION 'invalid quiz_mode'; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_quiz_score ON public.quiz_scores;
CREATE TRIGGER trg_validate_quiz_score
  BEFORE INSERT ON public.quiz_scores
  FOR EACH ROW EXECUTE FUNCTION public.validate_quiz_score();

-- Validation trigger for daily_subscribers
CREATE OR REPLACE FUNCTION public.validate_daily_subscriber()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.channel NOT IN ('push','telegram','sms') THEN RAISE EXCEPTION 'invalid channel'; END IF;
  IF NEW.first_name IS NOT NULL AND length(NEW.first_name) > 100 THEN RAISE EXCEPTION 'first_name too long'; END IF;
  IF NEW.phone_number IS NOT NULL AND length(NEW.phone_number) > 30 THEN RAISE EXCEPTION 'phone_number too long'; END IF;
  IF NEW.language IS NOT NULL AND length(NEW.language) > 10 THEN RAISE EXCEPTION 'language too long'; END IF;
  NEW.is_active := true;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_daily_subscriber ON public.daily_subscribers;
CREATE TRIGGER trg_validate_daily_subscriber
  BEFORE INSERT ON public.daily_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.validate_daily_subscriber();

-- Validation trigger for church_partnership_inquiries
CREATE OR REPLACE FUNCTION public.validate_partnership_inquiry()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF length(trim(NEW.name)) < 1 OR length(NEW.name) > 200 THEN RAISE EXCEPTION 'name must be 1-200 characters'; END IF;
  IF NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'invalid email format'; END IF;
  IF length(NEW.email) > 320 THEN RAISE EXCEPTION 'email too long'; END IF;
  IF length(trim(NEW.message)) < 1 OR length(NEW.message) > 5000 THEN RAISE EXCEPTION 'message must be 1-5000 characters'; END IF;
  IF NEW.church_name IS NOT NULL AND length(NEW.church_name) > 300 THEN RAISE EXCEPTION 'church_name too long'; END IF;
  IF NEW.preferred_tier IS NOT NULL AND NEW.preferred_tier NOT IN ('free','community','gemeinde','kirche') THEN RAISE EXCEPTION 'invalid preferred_tier'; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_partnership_inquiry ON public.church_partnership_inquiries;
CREATE TRIGGER trg_validate_partnership_inquiry
  BEFORE INSERT ON public.church_partnership_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.validate_partnership_inquiry();
