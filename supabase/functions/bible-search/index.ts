import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function expandQuery(query: string): Promise<{
  tsquery: string;
  books: string[] | null;
  explanation: string;
}> {
  try {
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
            content: `Du bist ein Bibel-Suchassistent. Generiere deutsche Suchbegriffe für PostgreSQL Full-Text-Search.

Regeln für tsquery:
- Verwende | für OR zwischen Begriffen  
- Nur einzelne Wörter, keine Phrasen
- Generiere viele Synonyme und verwandte Begriffe
- Beispiel: "Liebe | lieben | Barmherzigkeit | Güte | Nächstenliebe"
- Beispiel: "Schöpfung | erschaffen | Anfang | Himmel | Erde"
- Keine Sonderzeichen ausser | und &`,
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
                    description: "PostgreSQL tsquery: words separated by | (OR). Example: 'Liebe | lieben | Güte'",
                  },
                  books: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional: relevant book names to boost",
                  },
                  explanation: {
                    type: "string",
                    description: "Brief German explanation of the search intent",
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
      console.error("AI expansion failed:", resp.status);
      return { tsquery: query.split(/\s+/).join(" | "), books: null, explanation: query };
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        tsquery: parsed.tsquery || query.split(/\s+/).join(" | "),
        books: parsed.books || null,
        explanation: parsed.explanation || query,
      };
    }
  } catch (e) {
    console.error("AI expansion error:", e);
  }
  return { tsquery: query.split(/\s+/).join(" | "), books: null, explanation: query };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, translation, limit = 20, language = "de" } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Suchanfrage muss mindestens 2 Zeichen lang sein" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: AI-powered query expansion
    const expanded = await expandQuery(query.trim());
    console.log("Expanded:", expanded.tsquery);

    // Step 2: Search using DB function with language filter
    const { data: results, error } = await supabase.rpc("search_bible_verses", {
      search_query: expanded.tsquery,
      translation_filter: translation === "all" ? null : (translation || null),
      book_boost: expanded.books,
      result_limit: Math.min(limit, 50),
      language_filter: language,
    });

    if (error) {
      console.error("RPC error, trying fallback:", error);
      // Fallback: simple textSearch
      const safeTerms = query.trim().split(/\s+/).slice(0, 5).join(" & ");
      let q = supabase
        .from("bible_verses")
        .select("id, book, book_number, chapter, verse, text, translation")
        .textSearch("fts", safeTerms, { config: "german" })
        .limit(Math.min(limit, 50));

      if (translation && translation !== "all") {
        q = q.eq("translation", translation);
      }

      const { data: fb, error: fbErr } = await q;
      if (fbErr) throw fbErr;

      return new Response(
        JSON.stringify({
          results: fb || [],
          query: expanded.explanation,
          expanded_terms: expanded.tsquery,
          total: fb?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        results: results || [],
        query: expanded.explanation,
        expanded_terms: expanded.tsquery,
        total: results?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bible-search error:", e);
    const status = e instanceof Error && e.message.includes("Rate") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
