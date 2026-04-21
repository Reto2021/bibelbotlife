-- Idempotency: Unique-Constraint für bible_verses, damit ON CONFLICT beim Upsert greift
-- und doppelte Verse beim Seeding/Re-Run zuverlässig vermieden werden.

-- 1) Bestehende Duplikate bereinigen (nur neueste Zeile pro Schlüssel behalten)
DELETE FROM public.bible_verses a
USING public.bible_verses b
WHERE a.ctid < b.ctid
  AND a.translation = b.translation
  AND a.book_number = b.book_number
  AND a.chapter     = b.chapter
  AND a.verse       = b.verse;

-- 2) Unique-Constraint ergänzen (falls noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.bible_verses'::regclass
      AND conname  = 'bible_verses_translation_book_number_chapter_verse_key'
  ) THEN
    ALTER TABLE public.bible_verses
      ADD CONSTRAINT bible_verses_translation_book_number_chapter_verse_key
      UNIQUE (translation, book_number, chapter, verse);
  END IF;
END $$;

-- 3) Retry-Felder am Fetch-Log ergänzen (Backoff-Steuerung + Versuchszähler)
ALTER TABLE public.bible_chapter_fetch_log
  ADD COLUMN IF NOT EXISTS attempts        integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at   timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_code text;

-- Index für effizientes Finden fälliger Retries
CREATE INDEX IF NOT EXISTS bible_chapter_fetch_log_retry_idx
  ON public.bible_chapter_fetch_log (status, next_retry_at)
  WHERE status = 'failed';