CREATE TABLE public.verse_meaning_index (
  language text NOT NULL DEFAULT 'de',
  book_number smallint NOT NULL,
  chapter smallint NOT NULL,
  verse smallint NOT NULL,
  source_translation text NOT NULL,
  embedding extensions.halfvec(3072) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (language, book_number, chapter, verse)
);
GRANT ALL ON public.verse_meaning_index TO service_role;
ALTER TABLE public.verse_meaning_index ENABLE ROW LEVEL SECURITY;
CREATE INDEX verse_meaning_index_hnsw ON public.verse_meaning_index
  USING hnsw (embedding extensions.halfvec_cosine_ops);

ALTER TABLE public.theology_chunks ADD COLUMN IF NOT EXISTS embedding_v2 extensions.halfvec(3072);
CREATE INDEX IF NOT EXISTS theology_chunks_embedding_v2_hnsw ON public.theology_chunks
  USING hnsw (embedding_v2 extensions.halfvec_cosine_ops);

CREATE OR REPLACE FUNCTION public.search_verse_meaning(query_embedding extensions.halfvec(3072), match_count integer DEFAULT 8, p_language text DEFAULT 'de')
RETURNS TABLE(book_number smallint, chapter smallint, verse smallint, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT v.book_number, v.chapter, v.verse, 1 - (v.embedding <=> query_embedding) AS similarity
  FROM public.verse_meaning_index v
  WHERE v.language = p_language
  ORDER BY v.embedding <=> query_embedding
  LIMIT least(greatest(match_count, 1), 30);
$$;

CREATE OR REPLACE FUNCTION public.search_theology_v2(query_embedding extensions.halfvec(3072), match_count integer DEFAULT 3)
RETURNS TABLE(id uuid, title text, content text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT t.id, t.title, t.content, 1 - (t.embedding_v2 <=> query_embedding) AS similarity
  FROM public.theology_chunks t
  WHERE t.embedding_v2 IS NOT NULL
  ORDER BY t.embedding_v2 <=> query_embedding
  LIMIT least(greatest(match_count, 1), 10);
$$;

-- Next batch of BasisBibel verses still missing from the meaning index
CREATE OR REPLACE FUNCTION public.next_verses_to_embed(p_limit integer DEFAULT 100)
RETURNS TABLE(book_number smallint, chapter smallint, verse smallint, text text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.book_number, r.chapter, r.verse, r.text
  FROM public.bible_verses_restricted r
  WHERE r.translation = 'basisbibel'
    AND NOT EXISTS (SELECT 1 FROM public.verse_meaning_index m
      WHERE m.language = 'de' AND m.book_number = r.book_number AND m.chapter = r.chapter AND m.verse = r.verse)
  ORDER BY r.book_number, r.chapter, r.verse
  LIMIT least(greatest(p_limit, 1), 500);
$$;

REVOKE ALL ON FUNCTION public.search_verse_meaning(extensions.halfvec, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_theology_v2(extensions.halfvec, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.next_verses_to_embed(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_verse_meaning(extensions.halfvec, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_theology_v2(extensions.halfvec, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.next_verses_to_embed(integer) TO service_role;