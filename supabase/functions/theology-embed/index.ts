import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const mode = body.mode || "import";

    // Mode: import — store chunks without embeddings (FTS-based retrieval)
    if (mode === "import") {
      const chunks: { source_type: string; title: string; content: string; metadata?: any }[] = body.chunks;
      if (!chunks?.length) {
        return new Response(JSON.stringify({ error: "chunks array required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows = chunks.map(c => ({
        source_type: c.source_type,
        title: c.title,
        content: c.content,
        metadata: c.metadata || {},
      }));

      const { error } = await supabase.from("theology_chunks").insert(rows);
      if (error) throw error;

      return new Response(JSON.stringify({ inserted: rows.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: search — FTS + AI reranking
    if (mode === "search") {
      const query = body.query;
      const filterSource = body.filter_source || null;
      const matchCount = body.match_count || 5;

      if (!query) {
        return new Response(JSON.stringify({ error: "query required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 1: AI-expand search terms
      let tsTerms = query.split(/\s+/).join(" | ");
      try {
        const expandResp = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Generiere deutsche Suchbegriffe für eine theologische Suche (PostgreSQL FTS).
Nur einzelne Wörter mit | (OR) getrennt. Viele Synonyme und verwandte theologische Begriffe.
Antworte NUR mit dem tsquery-String.`
              },
              { role: "user", content: query },
            ],
            stream: false,
          }),
        });
        if (expandResp.ok) {
          const d = await expandResp.json();
          const expanded = d.choices?.[0]?.message?.content?.trim();
          if (expanded) tsTerms = expanded;
        }
      } catch (e) {
        console.error("Expansion error:", e);
      }

      // Step 2: FTS search
      let q = supabase
        .from("theology_chunks")
        .select("id, source_type, title, content, metadata")
        .textSearch("content", tsTerms.replace(/\|/g, " | "), { config: "german" })
        .limit(matchCount * 2); // fetch more, rerank later

      if (filterSource) {
        q = q.eq("source_type", filterSource);
      }

      const { data: ftsResults, error: ftsErr } = await q;

      // Fallback: if FTS returns nothing, try title search
      if (!ftsResults?.length) {
        const { data: titleResults } = await supabase
          .from("theology_chunks")
          .select("id, source_type, title, content, metadata")
          .ilike("title", `%${query.split(/\s+/)[0]}%`)
          .limit(matchCount);

        return new Response(JSON.stringify({ results: titleResults || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return top results (skip AI reranking for speed)
      const results = ftsResults.slice(0, matchCount);

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode. Use 'import' or 'search'" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("theology-embed error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
