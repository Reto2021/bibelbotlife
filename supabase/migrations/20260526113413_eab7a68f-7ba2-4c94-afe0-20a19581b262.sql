-- Dedupe protection for referral conversions
DELETE FROM public.referral_conversions a
USING public.referral_conversions b
WHERE a.ctid < b.ctid
  AND a.inquiry_id IS NOT NULL
  AND a.inquiry_id = b.inquiry_id;

CREATE UNIQUE INDEX IF NOT EXISTS referral_conversions_inquiry_id_unique
  ON public.referral_conversions(inquiry_id)
  WHERE inquiry_id IS NOT NULL;