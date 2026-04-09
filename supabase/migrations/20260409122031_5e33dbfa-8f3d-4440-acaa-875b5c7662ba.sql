
-- Drop the old column and recreate with correct dimensions
ALTER TABLE public.theology_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.theology_chunks ADD COLUMN embedding vector(384);

-- Recreate the search function with correct dimensions
CREATE OR REPLACE FUNCTION public.search_theology(
  query_embedding vector(384),
  match_threshold double precision DEFAULT 0.3,
  match_count integer DEFAULT 5,
  filter_source theology_source_type DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  source_type theology_source_type,
  title text,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.source_type,
    tc.title,
    tc.content,
    tc.metadata,
    1 - (tc.embedding <=> query_embedding) AS similarity
  FROM public.theology_chunks tc
  WHERE
    tc.embedding IS NOT NULL
    AND (filter_source IS NULL OR tc.source_type = filter_source)
    AND 1 - (tc.embedding <=> query_embedding) > match_threshold
  ORDER BY tc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
