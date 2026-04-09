import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Use Supabase Edge Runtime's built-in gte-small model
const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 10, 25);

    // Fetch chunks without embeddings
    const { data: chunks, error: fetchErr } = await supabase
      .from("theology_chunks")
      .select("id, title, content")
      .is("embedding", null)
      .order("id")
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!chunks?.length) {
      return new Response(JSON.stringify({ message: "All chunks have embeddings", remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      try {
        const text = `${chunk.title}: ${chunk.content}`.substring(0, 512);

        // Generate embedding using built-in gte-small
        const embedding = await model.run(text, {
          mean_pool: true,
          normalize: true,
        });

        // Convert Float32Array to regular array
        const embeddingArray = Array.from(embedding);

        // Store embedding
        const { error: updateErr } = await supabase
          .from("theology_chunks")
          .update({ embedding: JSON.stringify(embeddingArray) })
          .eq("id", chunk.id);

        if (updateErr) {
          errors.push(`${chunk.id}: ${updateErr.message}`);
        } else {
          updated++;
        }
      } catch (e) {
        errors.push(`${chunk.id}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("theology_chunks")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return new Response(JSON.stringify({
      processed: chunks.length,
      updated,
      remaining: count || 0,
      errors: errors.length ? errors.slice(0, 5) : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
