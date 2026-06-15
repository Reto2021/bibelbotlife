import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Protestant 66-book canon order matches NIV
const BOOK_ORDER = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI',
  '1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER',
  'LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP',
  'HAG','ZEC','MAL',
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL',
  '1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN',
  '3JN','JUD','REV'
];
const BNUM: Record<string, number> = Object.fromEntries(BOOK_ORDER.map((a, i) => [a, i + 1]));

function clean(t: string) {
  return t.replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({} as any));
    const mode: string = body.mode || "all"; // "verses" | "headings" | "all"
    const offset: number = body.offset || 0;
    const chapterLimit: number = body.chapter_limit || 1189;

    const { data: blob, error: dlErr } = await supabase
      .storage.from("bible-imports").download("niv_chapters.json");
    if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message}`);
    const text = await blob.text();
    const data = JSON.parse(text);

    let versesInserted = 0;
    let headingsInserted = 0;
    const errors: string[] = [];

    const verseBatch: any[] = [];
    const headingBatch: any[] = [];

    const slice = data.slice(offset, offset + chapterLimit);

    for (const ch of slice) {
      const bn = BNUM[ch.book_abbr];
      if (!bn) continue;

      if (mode === "all" || mode === "verses") {
        // Dedupe by verse number within chapter — some JSON entries have malformed short ids
        const seenVerses = new Set<number>();
        for (const [vid, txt] of Object.entries(ch.verses || {})) {
          // Require full dotted id like "GEN.1.9" — skip short malformed ids like "9"
          if (!String(vid).includes(".")) continue;
          const vnumMatch = String(vid).split(".").pop()?.match(/(\d+)/);
          if (!vnumMatch) continue;
          const vn = parseInt(vnumMatch[1]);
          if (seenVerses.has(vn)) continue;
          seenVerses.add(vn);
          verseBatch.push({
            book: ch.book,
            book_number: bn,
            chapter: ch.chapter,
            verse: vn,
            text: clean(String(txt)),
            translation: "NIV",
            language: "en",
            source_url: "https://www.biblica.com/bible/niv/",
          });
        }
      }
      if (mode === "all" || mode === "headings") {
        (ch.headings || []).forEach((h: string, i: number) => {
          headingBatch.push({
            translation: "NIV", language: "en",
            book_number: bn, book: ch.book,
            chapter: ch.chapter, position: i,
            heading: clean(h),
          });
        });
      }
    }

    async function bulkUpsert(table: string, rows: any[], onConflict?: string) {
      const CHUNK = 1000;
      let count = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const sub = rows.slice(i, i + CHUNK);
        const { error } = await supabase.from(table).upsert(sub, onConflict ? { onConflict } : undefined);
        if (error) {
          errors.push(`${table}@${i}: ${error.message}`);
        } else {
          count += sub.length;
        }
      }
      return count;
    }

    if (verseBatch.length) {
      versesInserted = await bulkUpsert("bible_verses_restricted", verseBatch, "translation,book_number,chapter,verse");
    }
    if (headingBatch.length) {
      headingsInserted = await bulkUpsert("bible_chapter_headings", headingBatch, "translation,book_number,chapter,position");
    }

    return new Response(JSON.stringify({
      success: true,
      processed_chapters: slice.length,
      offset, chapter_limit: chapterLimit,
      next_offset: offset + slice.length < data.length ? offset + slice.length : null,
      total_chapters: data.length,
      verses_inserted: versesInserted,
      headings_inserted: headingsInserted,
      errors: errors.slice(0, 20),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
