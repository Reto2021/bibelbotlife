import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Use Supabase's built-in AI for embeddings via SQL
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 20;

    // Fetch chunks without embeddings
    const { data: chunks, error: fetchErr } = await supabase
      .from("theology_chunks")
      .select("id, title, content")
      .is("embedding", null)
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
      const text = `${chunk.title}: ${chunk.content}`.substring(0, 2000);

      try {
        // Use Supabase's built-in AI embedding via SQL
        const { error: updateErr } = await supabase.rpc("generate_and_store_embedding", {
          chunk_id: chunk.id,
          input_text: text,
        });

        if (updateErr) {
          // Fallback: try direct SQL approach
          const { error: sqlErr } = await supabase.from("theology_chunks")
            .update({ embedding: null }) // placeholder
            .eq("id", chunk.id);
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
      errors: errors.slice(0, 5),
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
