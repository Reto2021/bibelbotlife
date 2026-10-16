// Fills the meaning index with Gemini Embedding 2:
// 1) theology_chunks.embedding_v2, 2) verse_meaning_index from BasisBibel verses.
// Called by cron (x-cron-key) or an admin. Each run embeds a bounded number of batches.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAdminOrService } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
};

const MODEL = "google/gemini-embedding-2";
const VERSE_BATCH = 100;
const MAX_BATCHES = 15;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function embed(texts: string[]): Promise<number[][]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, input: texts }),
    });
    if (res.ok) {
      const data = await res.json();
      const out: number[][] = new Array(texts.length);
      for (const d of data.data) out[d.index] = d.embedding;
      return out;
    }
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1) + Math.random() * 500));
      continue;
    }
    throw new Error(`embed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error("embed: retries exhausted");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = await requireAdminOrService(req);
  if (!auth.ok) return auth.response;

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let theology = 0, verses = 0;
  try {
    for (let b = 0; b < MAX_BATCHES; b++) {
      const { data: chunks, error: chErr } = await sb
        .from("theology_chunks").select("id,title,content").is("embedding_v2", null).limit(50);
      if (chErr) throw chErr;
      if (chunks && chunks.length) {
        const vecs = await embed(chunks.map((c) => `${c.title}\n${c.content}`.slice(0, 8000)));
        await Promise.all(chunks.map(async (c, i) => {
          const { error } = await sb.from("theology_chunks").update({ embedding_v2: JSON.stringify(vecs[i]) }).eq("id", c.id);
          if (error) throw error;
        }));
        theology += chunks.length;
        continue;
      }
      const { data: rows, error } = await sb.rpc("next_verses_to_embed", { p_limit: VERSE_BATCH });
      if (error) throw error;
      if (!rows || rows.length === 0) break;
      const vecs = await embed(rows.map((r: { text: string }) => r.text));
      const insert = rows.map((r: { book_number: number; chapter: number; verse: number }, i: number) => ({
        language: "de", book_number: r.book_number, chapter: r.chapter, verse: r.verse,
        source_translation: "basisbibel", embedding: JSON.stringify(vecs[i]),
      }));
      const { error: insErr } = await sb.from("verse_meaning_index").upsert(insert);
      if (insErr) throw insErr;
      verses += rows.length;
    }
    const { count } = await sb.from("verse_meaning_index").select("*", { count: "exact", head: true });
    // Drain: if this run did work, chain the next run (stops by itself when nothing is left).
    const cronKey = req.headers.get("x-cron-key");
    if ((theology > 0 || verses > 0) && cronKey) {
      // @ts-ignore EdgeRuntime is provided by the Supabase runtime
      EdgeRuntime.waitUntil(fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/theology-embed-batch`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-cron-key": cronKey }, body: "{}",
      }).catch((e) => console.error("chain failed", e)));
    }
    return json({ ok: true, theology, verses, total_verses_indexed: count });
  } catch (e) {
    console.error("meaning-embed", e);
    return json({ ok: false, theology, verses, error: String((e as Error)?.message ?? e) }, 500);
  }
});
