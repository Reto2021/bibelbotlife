CREATE TABLE public.verse_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood text NOT NULL,
  area text NOT NULL,
  prompt text,
  verse_ref text NOT NULL,
  verse_text text NOT NULL,
  explanation text NOT NULL,
  language text NOT NULL DEFAULT 'de',
  bg_style text NOT NULL DEFAULT 'golden',
  share_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.verse_cards TO anon, authenticated;
GRANT ALL ON public.verse_cards TO service_role;

ALTER TABLE public.verse_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verse cards"
  ON public.verse_cards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_verse_cards_created_at ON public.verse_cards(created_at DESC);

CREATE OR REPLACE FUNCTION public.increment_verse_card_views(card_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.verse_cards SET view_count = view_count + 1 WHERE id = card_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_verse_card_shares(card_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.verse_cards SET share_count = share_count + 1 WHERE id = card_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_verse_card_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_verse_card_shares(uuid) TO anon, authenticated;