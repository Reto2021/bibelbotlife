
CREATE OR REPLACE FUNCTION public.get_referral_partner_stats(p_code text)
RETURNS TABLE(
  name text,
  code text,
  is_active boolean,
  total_clicks integer,
  total_conversions integer,
  total_commission numeric,
  commission_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rp.name,
    rp.code,
    rp.is_active,
    rp.total_clicks,
    rp.total_conversions,
    rp.total_commission,
    rp.commission_rate
  FROM public.referral_partners rp
  WHERE rp.code = p_code AND rp.is_active = true
  LIMIT 1;
$$;
