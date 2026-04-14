
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact form (public insert)
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read contact submissions
CREATE POLICY "Admins can read contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_contact_submission()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF length(trim(NEW.name)) < 1 OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'name must be 1-200 characters';
  END IF;
  IF NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid email format';
  END IF;
  IF length(NEW.email) > 320 THEN
    RAISE EXCEPTION 'email too long';
  END IF;
  IF NEW.category NOT IN ('feedback', 'question', 'partnership', 'other') THEN
    RAISE EXCEPTION 'invalid category';
  END IF;
  IF length(trim(NEW.message)) < 1 OR length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'message must be 1-5000 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_contact_submission
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_submission();
