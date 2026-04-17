import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use Supabase Edge Runtime's built-in gte-small model (384 dims)
const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const { id, question } = body as { id?: string; question?: string };

    if (id && !question) {
      // Embed by id — read row, embed question, save
      const { data: row, error } = await supabase
        .from("golden_answers")
        .select("id, question")
        .eq("id", id)
        .single();
      if (error) throw error;

      const text = row.question.substring(0, 512);
      const embedding = await model.run(text, { mean_pool: true, normalize: true });
      const arr = Array.from(embedding);

      const { error: updateErr } = await supabase
        .from("golden_answers")
        .update({ embedding: JSON.stringify(arr) })
        .eq("id", id);
      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ ok: true, id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch mode: embed all rows without embedding
    const { data: rows, error: fetchErr } = await supabase
      .from("golden_answers")
      .select("id, question")
      .is("embedding", null)
      .limit(25);
    if (fetchErr) throw fetchErr;

    let updated = 0;
    for (const r of rows || []) {
      try {
        const embedding = await model.run(r.question.substring(0, 512), {
          mean_pool: true,
          normalize: true,
        });
        const arr = Array.from(embedding);
        await supabase
          .from("golden_answers")
          .update({ embedding: JSON.stringify(arr) })
          .eq("id", r.id);
        updated++;
      } catch (e) {
        console.error("embed err", r.id, e);
      }
    }

    return new Response(JSON.stringify({ updated, total: rows?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("golden-answer-embed error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
