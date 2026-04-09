import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Use AI to understand the semantic intent and generate search terms */
async function expandQuery(query: string): Promise<{
  tsquery: string;
  books?: string[];
  explanation: string;
}> {
  const resp = await fetch(AI_GATEWAY, {
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
          content: `Du bist ein Bibel-Suchassistent. Der Nutzer gibt eine Suchanfrage ein. Deine Aufgabe:
1. Verstehe die semantische Bedeutung der Anfrage
2. Generiere deutsche Suchbegriffe für PostgreSQL Full-Text-Search (tsquery Format mit | für OR und & für AND)
3. Optional: Schlage relevante Bücher vor (deutsche Namen)
4. Gib eine kurze Erklärung was gesucht wird

Wichtig: Generiere VIELE synonyme/verwandte Begriffe. Z.B. für "Liebe" auch "lieben", "Nächstenliebe", "Barmherzigkeit", "Güte".
Für "Schöpfung" auch "erschaffen", "Anfang", "Himmel", "Erde", "Gott schuf".`,
        },
        { role: "user", content: query },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "search_bible",
            description: "Execute semantic Bible search",
            parameters: {
              type: "object",
              properties: {
                tsquery: {
                  type: "string",
                  description:
                    "PostgreSQL tsquery string with | for OR, & for AND. Use simple German words. Example: 'Liebe | lieben | Barmherzigkeit | Güte'",
                },
                books: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Optional relevant book names to filter by (e.g. ['Matthäus', 'Johannes'])",
                },
                explanation: {
                  type: "string",
                  description: "Brief explanation of the search intent in German",
                },
              },
              required: ["tsquery", "explanation"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "search_bible" } },
    }),
  });

  if (!resp.ok) {
    console.error("AI query expansion failed:", resp.status);
    // Fallback: use raw query
    return { tsquery: query.split(/\s+/).join(" | "), explanation: query };
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    return JSON.parse(toolCall.function.arguments);
  }
  return { tsquery: query.split(/\s+/).join(" | "), explanation: query };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, translation, limit = 20 } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: AI-powered query expansion
    const expanded = await expandQuery(query.trim());
    console.log("Expanded query:", expanded);

    // Step 2: Full-text search with expanded terms
    const safeQuery = expanded.tsquery
      .replace(/[^\w\sÄäÖöÜü|&!()]/g, "")
      .trim();

    let rpc_query = `SELECT id, book, book_number, chapter, verse, text, translation,
      ts_rank(fts, to_tsquery('german', $1)) as rank
      FROM bible_verses
      WHERE fts @@ to_tsquery('german', $1)`;

    const params: any[] = [safeQuery];

    if (translation && translation !== "all") {
      rpc_query += ` AND translation = $2`;
      params.push(translation);
    }

    if (expanded.books && expanded.books.length > 0) {
      // Boost results from suggested books but don't exclude others
      rpc_query += ` ORDER BY CASE WHEN book = ANY($${params.length + 1}) THEN rank * 2 ELSE rank END DESC`;
      params.push(expanded.books);
    } else {
      rpc_query += ` ORDER BY rank DESC`;
    }

    rpc_query += ` LIMIT $${params.length + 1}`;
    params.push(Math.min(limit, 50));

    // Use raw SQL via the supabase client
    const { data: results, error } = await supabase.rpc("exec_bible_search" as any, {
      search_query: safeQuery,
      translation_filter: translation === "all" ? null : (translation || null),
      book_filter: expanded.books || null,
      result_limit: Math.min(limit, 50),
    });

    if (error) {
      console.error("Search error, falling back to simple search:", error);
      // Fallback: simple text search
      let q = supabase
        .from("bible_verses")
        .select("id, book, book_number, chapter, verse, text, translation")
        .textSearch("fts", safeQuery, { type: "websearch", config: "german" })
        .limit(Math.min(limit, 50));

      if (translation && translation !== "all") {
        q = q.eq("translation", translation);
      }

      const { data: fallbackResults, error: fbError } = await q;
      if (fbError) {
        throw fbError;
      }

      return new Response(
        JSON.stringify({
          results: fallbackResults || [],
          query: expanded.explanation,
          expanded_terms: safeQuery,
          total: fallbackResults?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        results: results || [],
        query: expanded.explanation,
        expanded_terms: safeQuery,
        total: results?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bible-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
