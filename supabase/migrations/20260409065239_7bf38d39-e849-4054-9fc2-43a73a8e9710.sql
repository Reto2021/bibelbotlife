CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TYPE public.theology_source_type AS ENUM ('lexikon', 'kommentar', 'konfession', 'seelsorge');

CREATE TABLE public.theology_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type public.theology_source_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  embedding extensions.vector(768),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX theology_chunks_embedding_idx ON public.theology_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX theology_chunks_content_fts_idx ON public.theology_chunks
  USING gin (to_tsvector('german', content));

CREATE INDEX theology_chunks_source_type_idx ON public.theology_chunks (source_type);

ALTER TABLE public.theology_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read theology chunks"
  ON public.theology_chunks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.search_theology(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  filter_source public.theology_source_type DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_type public.theology_source_type,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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