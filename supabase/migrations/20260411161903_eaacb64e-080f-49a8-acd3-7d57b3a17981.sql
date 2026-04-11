
CREATE OR REPLACE FUNCTION public.get_referral_partner_conversions(p_code text)
RETURNS TABLE(created_at timestamptz, deal_value numeric, commission_amount numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rc.created_at, rc.deal_value, rc.commission_amount
  FROM public.referral_conversions rc
  JOIN public.referral_partners rp ON rp.id = rc.partner_id
  WHERE rp.code = p_code AND rp.is_active = true
  ORDER BY rc.created_at DESC
  LIMIT 50;
$$;
