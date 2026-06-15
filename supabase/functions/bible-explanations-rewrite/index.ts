import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const MODEL = "google/gemini-2.5-flash-lite";
const BATCH_SIZE = 25;
const MAX_PARALLEL = 8;

const SYSTEM_PROMPT = `Formuliere die folgende Bibelerklärung sinngemäss in eigenen Worten neu.
Regeln:
- Maximal 2 Sätze, sachlich, verständlich
- Schweizer Deutsch (nie ß, immer ss)
- Behalte die Kernaussage, ändere Satzbau und Wortwahl substantiell
- Gib NUR den umformulierten Text zurück, keine Einleitung, keine Anführungszeichen`;

async function rewriteOne(text: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const out = json?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("empty AI response");
  return out.replace(/ß/g, "ss");
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  const queue = items.slice();
  const workers = Array.from({ length: n }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      try { await fn(item); } catch (_) { /* handled per-item */ }
    }
  });
  await Promise.all(workers);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const iteration = parseInt(url.searchParams.get("i") || "0");
  const maxIterations = 5000;

  try {
    // Fetch a batch
    const { data: rows, error } = await supabase
      .from("bible_explanations")
      .select("id, explanation")
      .eq("rewrite_status", "pending")
      .limit(BATCH_SIZE);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      // Done
      const { data: status } = await supabase.rpc("get_explanation_rewrite_status");
      return new Response(JSON.stringify({ done: true, status, iteration }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let success = 0;
    let failed = 0;

    await pool(rows, MAX_PARALLEL, async (row) => {
      try {
        const rewritten = await rewriteOne(row.explanation);
        const { error: updErr } = await supabase
          .from("bible_explanations")
          .update({
            explanation_rewritten: rewritten,
            rewritten_at: new Date().toISOString(),
            rewrite_status: "done",
            rewrite_error: null,
          })
          .eq("id", row.id);
        if (updErr) throw updErr;
        success++;
      } catch (e) {
        failed++;
        await supabase
          .from("bible_explanations")
          .update({
            rewrite_status: "failed",
            rewrite_error: String(e).slice(0, 500),
          })
          .eq("id", row.id);
      }
    });

    // Re-trigger self until done
    if (iteration < maxIterations) {
      const selfUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/bible-explanations-rewrite?i=${iteration + 1}`;
      // Fire and forget
      fetch(selfUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      done: false,
      iteration,
      processed: rows.length,
      success,
      failed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
