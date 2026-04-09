import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BIBLE_API = "https://bible.helloao.org/api";

const TRANSLATIONS = [
  { key: "luther1912", apiId: "deu_l12" },
  { key: "schlachter2000", apiId: "deu_sch" },
  { key: "elberfelder", apiId: "deu_elbbk" },
  { key: "kjv", apiId: "eng_kjv" },
  { key: "web", apiId: "eng_web" },
  { key: "niv", apiId: "eng_niv11" },
  { key: "esv", apiId: "eng_esv16" },
];

interface BookInfo {
  id: string;
  name: string;
  order: number;
  numberOfChapters: number;
}

async function fetchBooks(apiId: string): Promise<BookInfo[]> {
  const resp = await fetch(`${BIBLE_API}/${apiId}/books.json`);
  if (!resp.ok) throw new Error(`Failed to fetch books for ${apiId}`);
  const data = await resp.json();
  return data.books;
}

async function fetchChapter(apiId: string, bookId: string, chapter: number): Promise<{ number: number; text: string }[]> {
  const url = `${BIBLE_API}/${apiId}/${bookId}/${chapter}.json`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();
  const content = data?.chapter?.content;
  if (!Array.isArray(content)) return [];

  const verses: { number: number; text: string }[] = [];
  for (const item of content) {
    if (item.type === "verse" && item.number && item.content) {
      const text = Array.isArray(item.content)
        ? item.content.filter((c: any) => typeof c === "string").join(" ")
        : String(item.content);
      if (text.trim()) {
        verses.push({ number: item.number, text: text.replace(/<[^>]+>/g, "").trim() });
      }
    }
  }
  return verses;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const targetTranslation = body.translation;
    const startBook = body.start_book || 1;
    const endBook = body.end_book || 66;
    // Import only a few books per call to avoid timeout
    const maxBooks = body.max_books || 5;

    const translations = targetTranslation
      ? TRANSLATIONS.filter(t => t.key === targetTranslation)
      : TRANSLATIONS;

    if (translations.length === 0) {
      return new Response(
        JSON.stringify({ error: `Unknown translation: ${targetTranslation}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalInserted = 0;
    const errors: string[] = [];
    const progress: string[] = [];
    let booksProcessed = 0;
    let nextBook = 0;

    for (const trans of translations) {
      console.log(`Importing ${trans.key}...`);
      let books: BookInfo[];
      try {
        books = await fetchBooks(trans.apiId);
      } catch (e) {
        errors.push(`${trans.key}: ${e instanceof Error ? e.message : "fetch failed"}`);
        continue;
      }

      for (const book of books) {
        if (book.order < startBook || book.order > endBook) continue;
        if (booksProcessed >= maxBooks) {
          nextBook = book.order;
          break;
        }

        for (let ch = 1; ch <= book.numberOfChapters; ch++) {
          const verses = await fetchChapter(trans.apiId, book.id, ch);
          if (verses.length === 0) continue;

          const rows = verses.map(v => ({
            book: book.name,
            book_number: book.order,
            chapter: ch,
            verse: v.number,
            text: v.text,
            translation: trans.key,
          }));

          const { error } = await supabase
            .from("bible_verses")
            .upsert(rows, { onConflict: "translation,book_number,chapter,verse" });

          if (error) {
            errors.push(`${trans.key}/${book.name} ${ch}: ${error.message}`);
          } else {
            totalInserted += rows.length;
          }

          await new Promise(r => setTimeout(r, 30));
        }

        progress.push(`${trans.key}/${book.name}: ${book.numberOfChapters} ch`);
        console.log(`  ${book.name}: done`);
        booksProcessed++;
      }

      if (booksProcessed >= maxBooks) break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_inserted: totalInserted,
        books_processed: booksProcessed,
        next_book: nextBook > 0 ? nextBook : null,
        progress,
        errors: errors.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Import failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
