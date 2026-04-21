DELETE FROM bible_chapter_fetch_log l
WHERE l.status = 'success'
  AND NOT EXISTS (
    SELECT 1 FROM bible_verses_restricted v
    WHERE v.translation = l.translation
      AND v.book_number = l.book_number
      AND v.chapter = l.chapter
  );