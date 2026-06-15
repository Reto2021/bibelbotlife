import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOOK_ORDER = ['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
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
    const mode: string = body.mode || "all"; // "verses" | "headings" | "explanations" | "all"
    const offset: number = body.offset || 0;
    const chapterLimit: number = body.chapter_limit || 1189;

    // Download the JSON from storage
    const { data: blob, error: dlErr } = await supabase
      .storage.from("bible-imports").download("basisbibel.json");
    if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message}`);
    const text = await blob.text();
    const data = JSON.parse(text);

    let versesInserted = 0;
    let headingsInserted = 0;
    let explanationsInserted = 0;
    const errors: string[] = [];

    const verseBatch: any[] = [];
    const headingBatch: any[] = [];
    const explanationBatch: any[] = [];

    const slice = data.slice(offset, offset + chapterLimit);

    for (const ch of slice) {
      const bn = BNUM[ch.book_abbr];
      if (!bn) continue;

      if (mode === "all" || mode === "verses") {
        for (const [vid, txt] of Object.entries(ch.verses || {})) {
          const vnumMatch = String(vid).split(".").pop()?.match(/(\d+)/);
          if (!vnumMatch) continue;
          verseBatch.push({
            book: ch.book,
            book_number: bn,
            chapter: ch.chapter,
            verse: parseInt(vnumMatch[1]),
            text: clean(String(txt)),
            translation: "basisbibel",
            language: "de",
          });
        }
      }
      if (mode === "all" || mode === "headings") {
        (ch.headings || []).forEach((h: string, i: number) => {
          headingBatch.push({
            translation: "basisbibel", language: "de",
            book_number: bn, book: ch.book,
            chapter: ch.chapter, position: i,
            heading: clean(h),
          });
        });
      }
      if (mode === "all" || mode === "explanations") {
        for (const ex of (ch.explanations || [])) {
          const m = String(ex.ref || "").match(/(\d+)\s*,\s*(\d+)/);
          if (!m) continue;
          explanationBatch.push({
            translation: "basisbibel", language: "de",
            book_number: bn, book: ch.book,
            chapter: parseInt(m[1]),
            verse: parseInt(m[2]),
            keyword: clean(String(ex.keyword || "")),
            explanation: clean(String(ex.explanation || "")),
          });
        }
      }
    }

    // Bulk insert in chunks of 1000
    async function bulkUpsert(table: string, rows: any[], onConflict?: string) {
      const CHUNK = 1000;
      let count = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const q = supabase.from(table).upsert(slice, onConflict ? { onConflict } : undefined);
        const { error } = await q;
        if (error) {
          errors.push(`${table}@${i}: ${error.message}`);
        } else {
          count += slice.length;
        }
      }
      return count;
    }

    if (verseBatch.length) {
      versesInserted = await bulkUpsert("bible_verses", verseBatch, "translation,book_number,chapter,verse");
    }
    if (headingBatch.length) {
      // delete existing positions first to avoid stale headings
      headingsInserted = await bulkUpsert("bible_chapter_headings", headingBatch, "translation,book_number,chapter,position");
    }
    if (explanationBatch.length) {
      // For explanations there is no unique constraint; clear first if processing a chapter range
      // Simplest: delete existing basisbibel explanations in this slice, then insert
      const bookNums = Array.from(new Set(slice.map((c: any) => BNUM[c.book_abbr]).filter(Boolean)));
      const chapters = Array.from(new Set(slice.map((c: any) => c.chapter)));
      // Delete only the (book,chapter) pairs we are about to insert
      const pairs = slice.map((c: any) => ({ b: BNUM[c.book_abbr], c: c.chapter })).filter((p: any) => p.b);
      // Use OR filter
      for (let i = 0; i < pairs.length; i += 200) {
        const sub = pairs.slice(i, i + 200);
        const filter = sub.map((p: any) => `and(book_number.eq.${p.b},chapter.eq.${p.c})`).join(",");
        await supabase.from("bible_explanations").delete()
          .eq("translation", "basisbibel")
          .or(filter);
      }
      explanationsInserted = await bulkUpsert("bible_explanations", explanationBatch);
    }

    return new Response(JSON.stringify({
      success: true,
      processed_chapters: slice.length,
      offset, chapter_limit: chapterLimit,
      next_offset: offset + slice.length < data.length ? offset + slice.length : null,
      total_chapters: data.length,
      verses_inserted: versesInserted,
      headings_inserted: headingsInserted,
      explanations_inserted: explanationsInserted,
      errors: errors.slice(0, 20),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
