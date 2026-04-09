import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Embedding failed (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return data.embedding.values;
}

async function getQueryEmbedding(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
    }),
  });
  if (!resp.ok) throw new Error(`Query embedding failed: ${resp.status}`);
  const data = await resp.json();
  return data.embedding.values;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const mode = body.mode || "embed";

    // Mode: embed — embed and store chunks
    if (mode === "embed") {
      const chunks: { source_type: string; title: string; content: string; metadata?: any }[] = body.chunks;
      if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        return new Response(JSON.stringify({ error: "chunks array required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let inserted = 0;
      const errors: string[] = [];

      for (const chunk of chunks) {
        try {
          const embedding = await getEmbedding(
            `${chunk.title}\n\n${chunk.content}`,
            GEMINI_API_KEY
          );

          const { error } = await supabase.from("theology_chunks").insert({
            source_type: chunk.source_type,
            title: chunk.title,
            content: chunk.content,
            metadata: chunk.metadata || {},
            embedding: JSON.stringify(embedding),
          });

          if (error) {
            errors.push(`${chunk.title}: ${error.message}`);
          } else {
            inserted++;
          }

          // Rate limit: ~1 req/sec for embedding API
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          errors.push(`${chunk.title}: ${e instanceof Error ? e.message : "unknown"}`);
        }
      }

      return new Response(JSON.stringify({ inserted, errors, total: chunks.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: search — vector similarity search
    if (mode === "search") {
      const query = body.query;
      const filterSource = body.filter_source || null;
      const matchCount = body.match_count || 5;

      if (!query) {
        return new Response(JSON.stringify({ error: "query required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const embedding = await getQueryEmbedding(query, GEMINI_API_KEY);

      const { data, error } = await supabase.rpc("search_theology", {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.3,
        match_count: matchCount,
        filter_source: filterSource,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ results: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: embed_missing — embed chunks that have no embedding yet
    if (mode === "embed_missing") {
      const { data: missing, error: fetchErr } = await supabase
        .from("theology_chunks")
        .select("id, title, content")
        .is("embedding", null)
        .limit(50);

      if (fetchErr) throw fetchErr;
      if (!missing || missing.length === 0) {
        return new Response(JSON.stringify({ message: "No missing embeddings", count: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let updated = 0;
      for (const chunk of missing) {
        try {
          const embedding = await getEmbedding(`${chunk.title}\n\n${chunk.content}`, GEMINI_API_KEY);
          await supabase.from("theology_chunks").update({
            embedding: JSON.stringify(embedding),
          }).eq("id", chunk.id);
          updated++;
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error(`Embed error for ${chunk.id}:`, e);
        }
      }

      return new Response(JSON.stringify({ updated, total: missing.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("theology-embed error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
