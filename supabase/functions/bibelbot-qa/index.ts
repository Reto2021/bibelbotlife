import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QA_SYSTEM_PROMPT = `Du bist ein theologischer Faktenprüfer. Deine einzige Aufgabe ist es, Bibelzitate in einem Text auf Korrektheit zu prüfen.

Prüfe für jedes Bibelzitat im Text:
1. Existiert die angegebene Bibelstelle (Buch, Kapitel, Vers)?
2. Stimmt der zitierte Wortlaut mit der genannten Übersetzung überein?
3. Ist der Kontext korrekt wiedergegeben?
4. Ist die Zuordnung zur Übersetzung korrekt?

Verwende kein "ß", immer "ss" (Schweizer Deutsch).

Antworte AUSSCHLIESSLICH im folgenden JSON-Format, ohne Markdown-Codeblöcke:
{
  "citations_found": 3,
  "issues": [
    {
      "citation": "Johannes 3,16",
      "problem": "Beschreibung des Problems",
      "correction": "Korrekte Version oder Hinweis"
    }
  ],
  "has_issues": true/false,
  "summary": "Kurze Zusammenfassung für den Nutzer (1 Satz)"
}

Wenn KEINE Zitate gefunden werden, antworte:
{"citations_found": 0, "issues": [], "has_issues": false, "summary": "Keine Bibelzitate gefunden."}

Wenn alle Zitate korrekt sind:
{"citations_found": N, "issues": [], "has_issues": false, "summary": "Alle N Bibelzitate sind korrekt."}

Sei streng aber fair. Melde nur echte Fehler, keine stilistischen Präferenzen.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "text string is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: QA_SYSTEM_PROMPT },
            { role: "user", content: `Prüfe alle Bibelzitate in folgendem Text:\n\n${text}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("QA gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "QA error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response from the QA model
    let qaResult;
    try {
      // Strip potential markdown code blocks
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      qaResult = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse QA response:", content);
      qaResult = {
        citations_found: 0,
        issues: [],
        has_issues: false,
        summary: "Prüfung konnte nicht durchgeführt werden.",
        raw: content,
      };
    }

    return new Response(JSON.stringify(qaResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bibelbot-qa error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
