import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  const { sourceJson, targetLang, langName } = await req.json();

  const prompt = `Translate this JSON from German to ${langName}. Rules:
- Keep ALL JSON keys exactly as they are
- Only translate the string values
- Keep URLs, emoji, \\n characters, brand names (BibleBot, BibleBot.Life, Telegram, WhatsApp, Instagram) unchanged
- Return ONLY the complete valid JSON object
- No markdown fences, no explanation, no comments
- The output must be valid parseable JSON`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt + "\n\n" + JSON.stringify(sourceJson) }],
      temperature: 0.15,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  const data = await response.json();
  let content = data.choices[0].message.content.trim();
  content = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  try {
    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON from AI", raw: content.substring(0, 500) }), { status: 500 });
  }
});
