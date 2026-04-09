import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BIBLE_API = "https://bible.helloao.org/api";

const TRANSLATIONS = [
  { key: "luther1912", apiId: "deu_l12", name: "Luther 1912" },
  { key: "schlachter2000", apiId: "deu_sch", name: "Schlachter 1951" },
  { key: "elberfelder", apiId: "deu_elbbk", name: "Elberfelder" },
];

// Standard 66 books
const BOOKS = [
  { num: 1, id: "GEN", de: "1. Mose" },
  { num: 2, id: "EXO", de: "2. Mose" },
  { num: 3, id: "LEV", de: "3. Mose" },
  { num: 4, id: "NUM", de: "4. Mose" },
  { num: 5, id: "DEU", de: "5. Mose" },
  { num: 6, id: "JOS", de: "Josua" },
  { num: 7, id: "JDG", de: "Richter" },
  { num: 8, id: "RUT", de: "Rut" },
  { num: 9, id: "1SA", de: "1. Samuel" },
  { num: 10, id: "2SA", de: "2. Samuel" },
  { num: 11, id: "1KI", de: "1. Könige" },
  { num: 12, id: "2KI", de: "2. Könige" },
  { num: 13, id: "1CH", de: "1. Chronik" },
  { num: 14, id: "2CH", de: "2. Chronik" },
  { num: 15, id: "EZR", de: "Esra" },
  { num: 16, id: "NEH", de: "Nehemia" },
  { num: 17, id: "EST", de: "Ester" },
  { num: 18, id: "JOB", de: "Hiob" },
  { num: 19, id: "PSA", de: "Psalmen" },
  { num: 20, id: "PRO", de: "Sprüche" },
  { num: 21, id: "ECC", de: "Prediger" },
  { num: 22, id: "SNG", de: "Hoheslied" },
  { num: 23, id: "ISA", de: "Jesaja" },
  { num: 24, id: "JER", de: "Jeremia" },
  { num: 25, id: "LAM", de: "Klagelieder" },
  { num: 26, id: "EZK", de: "Hesekiel" },
  { num: 27, id: "DAN", de: "Daniel" },
  { num: 28, id: "HOS", de: "Hosea" },
  { num: 29, id: "JOL", de: "Joel" },
  { num: 30, id: "AMO", de: "Amos" },
  { num: 31, id: "OBA", de: "Obadja" },
  { num: 32, id: "JON", de: "Jona" },
  { num: 33, id: "MIC", de: "Micha" },
  { num: 34, id: "NAM", de: "Nahum" },
  { num: 35, id: "HAB", de: "Habakuk" },
  { num: 36, id: "ZEP", de: "Zefanja" },
  { num: 37, id: "HAG", de: "Haggai" },
  { num: 38, id: "ZEC", de: "Sacharja" },
  { num: 39, id: "MAL", de: "Maleachi" },
  { num: 40, id: "MAT", de: "Matthäus" },
  { num: 41, id: "MRK", de: "Markus" },
  { num: 42, id: "LUK", de: "Lukas" },
  { num: 43, id: "JHN", de: "Johannes" },
  { num: 44, id: "ACT", de: "Apostelgeschichte" },
  { num: 45, id: "ROM", de: "Römer" },
  { num: 46, id: "1CO", de: "1. Korinther" },
  { num: 47, id: "2CO", de: "2. Korinther" },
  { num: 48, id: "GAL", de: "Galater" },
  { num: 49, id: "EPH", de: "Epheser" },
  { num: 50, id: "PHP", de: "Philipper" },
  { num: 51, id: "COL", de: "Kolosser" },
  { num: 52, id: "1TH", de: "1. Thessalonicher" },
  { num: 53, id: "2TH", de: "2. Thessalonicher" },
  { num: 54, id: "1TI", de: "1. Timotheus" },
  { num: 55, id: "2TI", de: "2. Timotheus" },
  { num: 56, id: "TIT", de: "Titus" },
  { num: 57, id: "PHM", de: "Philemon" },
  { num: 58, id: "HEB", de: "Hebräer" },
  { num: 59, id: "JAS", de: "Jakobus" },
  { num: 60, id: "1PE", de: "1. Petrus" },
  { num: 61, id: "2PE", de: "2. Petrus" },
  { num: 62, id: "1JN", de: "1. Johannes" },
  { num: 63, id: "2JN", de: "2. Johannes" },
  { num: 64, id: "3JN", de: "3. Johannes" },
  { num: 65, id: "JUD", de: "Judas" },
  { num: 66, id: "REV", de: "Offenbarung" },
];

async function fetchChapter(apiId: string, bookId: string, chapter: number): Promise<Record<string, string> | null> {
  try {
    const url = `${BIBLE_API}/${apiId}/${bookId}/${chapter}.json`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    // The API returns { chapter: { number: { verse: text, ... } } } format
    // or { chapter: { 1: "text", 2: "text", ... } }
    const verses: Record<string, string> = {};
    if (data.chapter) {
      for (const [key, val] of Object.entries(data.chapter)) {
        if (typeof val === "string" && /^\d+$/.test(key)) {
          verses[key] = val.replace(/<[^>]+>/g, "").trim();
        }
      }
    }
    return Object.keys(verses).length > 0 ? verses : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow service role / admin
  const authHeader = req.headers.get("authorization") || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const targetTranslation = body.translation; // optional: import specific translation
    const startBook = body.start_book || 1;
    const endBook = body.end_book || 66;

    const translations = targetTranslation
      ? TRANSLATIONS.filter(t => t.key === targetTranslation)
      : TRANSLATIONS;

    let totalInserted = 0;
    const errors: string[] = [];

    for (const trans of translations) {
      console.log(`Importing ${trans.name}...`);

      for (const book of BOOKS) {
        if (book.num < startBook || book.num > endBook) continue;

        // Try chapters 1-150 (Psalms has 150)
        const maxChapters = book.num === 19 ? 150 : 50;

        for (let ch = 1; ch <= maxChapters; ch++) {
          const verses = await fetchChapter(trans.apiId, book.id, ch);
          if (!verses) {
            if (ch === 1) {
              errors.push(`${trans.key}/${book.id}: no chapter 1`);
            }
            break; // No more chapters
          }

          const rows = Object.entries(verses).map(([vNum, text]) => ({
            book: book.de,
            book_number: book.num,
            chapter: ch,
            verse: parseInt(vNum),
            text,
            translation: trans.key,
          }));

          if (rows.length > 0) {
            const { error } = await supabase
              .from("bible_verses")
              .upsert(rows, { onConflict: "translation,book_number,chapter,verse" });

            if (error) {
              errors.push(`${trans.key}/${book.de} ${ch}: ${error.message}`);
            } else {
              totalInserted += rows.length;
            }
          }

          // Small delay to not overwhelm API
          await new Promise(r => setTimeout(r, 100));
        }

        console.log(`  ${book.de}: done`);
      }

      console.log(`${trans.name}: done`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_inserted: totalInserted,
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
