// Edge Function: pick-verse-for-mood
// Wählt anhand von Stimmung, Lebensbereich und optionalem Prompt einen Bibelvers
// + 2-Satz-Erklärung. Speichert in public.verse_cards und gibt {id, ...} zurück.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOOD_LABELS: Record<string, string> = {
  dankbar: "dankbar",
  aengstlich: "ängstlich, besorgt",
  traurig: "traurig, niedergeschlagen",
  suchend: "suchend, fragend",
  hoffnungsvoll: "hoffnungsvoll",
  muede: "müde, erschöpft",
};
const AREA_LABELS: Record<string, string> = {
  arbeit: "Arbeit & Alltag",
  familie: "Familie & Beziehungen",
  glaube: "Glaube & Spiritualität",
  sinn: "Sinn & Lebensrichtung",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const mood = String(body.mood || "").slice(0, 30);
    const area = String(body.area || "").slice(0, 30);
    const prompt = body.prompt ? String(body.prompt).slice(0, 200) : "";
    const language = String(body.language || "de").slice(0, 5);

    if (!MOOD_LABELS[mood] || !AREA_LABELS[area]) {
      return new Response(JSON.stringify({ error: "invalid mood/area" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const sys = `Du bist ein einfühlsamer Bibel-Begleiter. Wähle EINEN passenden Bibelvers (Schlachter 2000 oder Zürcher Bibel) und schreibe eine warme, kurze Erklärung in 2 Sätzen, persönlich und auf die Stimmung des Users bezogen. Schweizer Deutsch (kein ß, immer ss). Keine Floskeln, kein "Liebe(r)", kein Pathos. Antworte AUSSCHLIESSLICH als JSON: {"verse_ref":"Jesaja 41,10","verse_text":"...","explanation":"..."}`;

    const user = `Stimmung: ${MOOD_LABELS[mood]}\nLebensbereich: ${AREA_LABELS[area]}${prompt ? `\nZusätzlicher Kontext: ${prompt}` : ""}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": lovableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI Gateway error", aiResp.status, errText);
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "rate_limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let parsed: { verse_ref: string; verse_text: string; explanation: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON in response");
      parsed = JSON.parse(m[0]);
    }

    if (!parsed.verse_ref || !parsed.verse_text || !parsed.explanation) {
      throw new Error("Missing fields in AI response");
    }

    const { data: card, error } = await supabase
      .from("verse_cards")
      .insert({
        mood,
        area,
        prompt: prompt || null,
        verse_ref: parsed.verse_ref.slice(0, 100),
        verse_text: parsed.verse_text.slice(0, 800),
        explanation: parsed.explanation.slice(0, 600),
        language,
      })
      .select("id, verse_ref, verse_text, explanation, mood, area, language, created_at")
      .single();

    if (error) {
      console.error("DB insert error", error);
      throw error;
    }

    return new Response(JSON.stringify(card), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pick-verse-for-mood error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
