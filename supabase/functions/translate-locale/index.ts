import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { sourceJson, targetLang, langName, mode } = await req.json();

  // mode: "diff" => sourceJson is a small object of just-changed keys; we return same shape translated.
  // mode: "full" (default) => translate the entire object.
  const isDiff = mode === "diff";

  const prompt = `Translate this JSON from German to ${langName} (${targetLang}). Rules:
- Keep ALL JSON keys EXACTLY as they are (do not translate keys)
- Only translate the string values
- Keep URLs, emoji, \\n characters, and brand names (BibleBot, BibleBot.Life, Telegram, WhatsApp, Instagram, 2Go Media AG) unchanged
- Preserve placeholders like {name}, {{count}}, %s exactly
- Return ONLY the complete valid JSON object with the SAME structure
- No markdown fences, no explanation, no comments
- Output MUST be valid parseable JSON`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: isDiff ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt + "\n\n" + JSON.stringify(sourceJson) }],
      temperature: 0.15,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await response.json();
  let content = data.choices[0].message.content.trim();
  content = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  try {
    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON from AI", raw: content.substring(0, 500) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
