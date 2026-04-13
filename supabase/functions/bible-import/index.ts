import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BIBLE_API = "https://bible.helloao.org/api";

const TRANSLATIONS = [
  // German
  { key: "luther1912", apiId: "deu_l12", language: "de" },
  { key: "schlachter2000", apiId: "deu_sch", language: "de" },
  { key: "elberfelder", apiId: "deu_elbbk", language: "de" },
  // English
  { key: "bsb", apiId: "eng_bsb", language: "en" },
  { key: "web", apiId: "eng_web", language: "en" },
  { key: "kjv", apiId: "eng_kjv", language: "en" },
  // French
  { key: "lsg", apiId: "fraLSG", language: "fr" },
  // Spanish
  { key: "rv09", apiId: "spa_rv09", language: "es" },
  // Italian
  { key: "riv", apiId: "ita_riv", language: "it" },
  // Portuguese
  { key: "arc", apiId: "por_arc", language: "pt" },
  // Dutch
  { key: "sv", apiId: "nld_sv", language: "nl" },
  // Polish
  { key: "bg", apiId: "pol_bg", language: "pl" },
  // Czech
  { key: "kr", apiId: "ces_kr", language: "cs" },
  // Romanian
  { key: "corn", apiId: "ron_corn", language: "ro" },
  // Russian
  { key: "syn", apiId: "rus_syn", language: "ru" },
  // Ukrainian
  { key: "ogi", apiId: "ukr_ogi", language: "uk" },
  // Arabic
  { key: "vd", apiId: "arb_vd", language: "ar" },
  // Korean
  { key: "krv", apiId: "kor_krv", language: "ko" },
  // Chinese
  { key: "cuv", apiId: "zho_cuv", language: "zh" },
  // Danish
  { key: "bib", apiId: "dan_bib", language: "da" },
  // Norwegian
  { key: "b30", apiId: "nor_b30", language: "no" },
  // Swedish
  { key: "svb", apiId: "swe_svb", language: "sv" },
  // Finnish
  { key: "pr", apiId: "fin_pr", language: "fi" },
  // Greek
  { key: "vam", apiId: "ell_vam", language: "el" },
  // Hungarian
  { key: "kar", apiId: "hun_kar", language: "hu" },
  // Croatian
  { key: "sar", apiId: "hrv_sar", language: "hr" },
  // Serbian
  { key: "srp_kar", apiId: "srp_kar", language: "sr" },
  // Slovak
  { key: "roh", apiId: "slk_roh", language: "sk" },
  // Bulgarian
  { key: "bpb", apiId: "bul_bpb", language: "bg" },
  // Vietnamese
  { key: "vb", apiId: "vie_vb", language: "vi" },
  // Indonesian
  { key: "tb", apiId: "ind_tb", language: "id" },
  // Filipino
  { key: "adb", apiId: "tgl_adb", language: "tl" },
  // Swahili
  { key: "suv", apiId: "swh_suv", language: "sw" },
  // Afrikaans
  { key: "a53", apiId: "afr_a53", language: "af" },
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
        ? item.content
            .map((c: any) => (typeof c === "string" ? c : c?.text || ""))
            .filter(Boolean)
            .join(" ")
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
            language: trans.language,
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
