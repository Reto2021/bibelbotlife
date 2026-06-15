ALTER VIEW public.church_partners_public SET (security_invoker = true);

CREATE POLICY "Deny anon select on bible_explanations"
  ON public.bible_explanations FOR SELECT TO anon USING (false);

CREATE POLICY "Deny authenticated select on bible_explanations"
  ON public.bible_explanations FOR SELECT TO authenticated USING (false);