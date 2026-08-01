DROP FUNCTION IF EXISTS public.increment_cross_prayer_count(uuid);

UPDATE public.cross_posts cp
SET prayer_count = c.prayers, amen_count = c.amens, share_count = c.shares
FROM (
  SELECT post_id,
    count(*) FILTER (WHERE kind = 'prayer')::integer AS prayers,
    count(*) FILTER (WHERE kind = 'amen')::integer AS amens,
    count(*) FILTER (WHERE kind = 'share')::integer AS shares
  FROM public.cross_interactions GROUP BY post_id
) c
WHERE cp.id = c.post_id;