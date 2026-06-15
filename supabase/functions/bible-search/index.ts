import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function expandQuery(query: string, language: string = "de"): Promise<{
  tsquery: string;
  books: string[] | null;
  explanation: string;
}> {
  const langInstructions: Record<string, { sys: string; example: string; explLang: string }> = {
    de: {
      sys: "Du bist ein Bibel-Suchassistent. Generiere deutsche Suchbegriffe für PostgreSQL Full-Text-Search.",
      example: "Liebe | lieben | Barmherzigkeit | Güte | Nächstenliebe",
      explLang: "German",
    },
    en: {
      sys: "You are a Bible search assistant. Generate English search terms for PostgreSQL Full-Text-Search.",
      example: "love | loved | loves | loving | mercy | kindness | compassion",
      explLang: "English",
    },
    fr: {
      sys: "Tu es un assistant de recherche biblique. Génère des termes français pour PostgreSQL Full-Text-Search.",
      example: "amour | aime | bonté | miséricorde",
      explLang: "French",
    },
    es: {
      sys: "Eres un asistente de búsqueda bíblica. Genera términos en español para PostgreSQL Full-Text-Search.",
      example: "amor | amar | bondad | misericordia",
      explLang: "Spanish",
    },
  };
  const cfg = langInstructions[language] || langInstructions.en;

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
            content: `${cfg.sys}

Rules for tsquery:
- Use | for OR between terms
- Single words only, no phrases
- Generate many synonyms and related terms in ${cfg.explLang}
- Example: "${cfg.example}"
- No special characters except | and &`,
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
                    description: `PostgreSQL tsquery: ${cfg.explLang} words separated by | (OR).`,
                  },
                  books: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional: relevant book names to boost",
                  },
                  explanation: {
                    type: "string",
                    description: `Brief ${cfg.explLang} explanation of the search intent`,
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

    const RESTRICTED = new Set(["basisbibel", "schlachter2000", "EU", "ELB", "NIV"]);

    // Step 0: Detect Bible reference (e.g., "Epheser 5", "Joh 3,16", "1. Mose 1,1-3")
    const refMatch = query.trim().match(
      /^\s*((?:[1-3]\.?\s*)?[A-Za-zÄÖÜäöüß]+)\s+(\d+)(?:[,:](\d+)(?:\s*[-–]\s*(\d+))?)?[,.\s]*$/
    );
    if (refMatch) {
      const [, bookRaw, chap, vFrom, vTo] = refMatch;
      const bookNorm = bookRaw.replace(/\s+/g, " ").trim();
      const tables = translation && translation !== "all"
        ? [RESTRICTED.has(translation) ? "bible_verses_restricted" : "bible_verses"]
        : ["bible_verses", "bible_verses_restricted"];
      const out: any[] = [];
      for (const tbl of tables) {
        let q = supabase
          .from(tbl)
          .select("id, book, book_number, chapter, verse, text, translation")
          .ilike("book", `${bookNorm}%`)
          .eq("chapter", Number(chap))
          .order("translation")
          .order("verse")
          .limit(Math.min(limit, 100));
        if (vFrom) {
          const from = Number(vFrom);
          const to = vTo ? Number(vTo) : from;
          q = q.gte("verse", from).lte("verse", to);
        }
        if (translation && translation !== "all") {
          q = q.eq("translation", translation);
        }
        const { data, error } = await q;
        if (error) console.error(`ref lookup ${tbl}:`, error);
        if (data) out.push(...data);
      }
      if (out.length > 0) {
        return new Response(
          JSON.stringify({
            results: out.slice(0, Math.min(limit, 100)),
            query: `${bookNorm} ${chap}${vFrom ? `,${vFrom}${vTo ? `-${vTo}` : ""}` : ""}`,
            expanded_terms: "reference_lookup",
            total: out.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 1: AI-powered query expansion
    const expanded = await expandQuery(query.trim(), language);
    console.log("Expanded:", expanded.tsquery);

    // Step 2: Search both public and restricted in parallel
    const wantsRestricted = !translation || translation === "all" || RESTRICTED.has(translation);
    const wantsPublic = !translation || translation === "all" || !RESTRICTED.has(translation);

    const [pubRes, restRes] = await Promise.all([
      wantsPublic
        ? supabase.rpc("search_bible_verses", {
            search_query: expanded.tsquery,
            translation_filter: translation === "all" || RESTRICTED.has(translation || "") ? null : (translation || null),
            book_boost: expanded.books,
            result_limit: Math.min(limit, 50),
            language_filter: language,
          })
        : Promise.resolve({ data: [], error: null }),
      wantsRestricted
        ? supabase.rpc("search_bible_verses_restricted", {
            search_query: expanded.tsquery,
            translation_filter: !translation || translation === "all" ? null : (RESTRICTED.has(translation) ? translation : null),
            book_boost: expanded.books,
            result_limit: Math.min(limit, 50),
            language_filter: language,
          })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (pubRes.error) console.error("public search error:", pubRes.error);
    if (restRes.error) console.error("restricted search error:", restRes.error);

    let results = [...(pubRes.data || []), ...(restRes.data || [])];
    results.sort((a: any, b: any) => (b.rank || 0) - (a.rank || 0));
    results = results.slice(0, Math.min(limit, 50));

    if (results.length === 0 && (pubRes.error || restRes.error)) {
      // Fallback: simple textSearch on public table only
      const safeTerms = query.trim().split(/\s+/).slice(0, 5).join(" & ");
      let q = supabase
        .from("bible_verses")
        .select("id, book, book_number, chapter, verse, text, translation")
        .textSearch("fts", safeTerms, { config: "german" })
        .limit(Math.min(limit, 50));
      if (translation && translation !== "all" && !RESTRICTED.has(translation)) {
        q = q.eq("translation", translation);
      }
      const { data: fb } = await q;
      results = fb || [];
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
