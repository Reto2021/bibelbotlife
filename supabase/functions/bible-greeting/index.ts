// Generates a short, personal Bible greeting on demand (e.g. for birthdays,
// anniversaries). Returns { title, verse, reflection, share_text } — safe to
// share via Web Share / copy / social.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      recipient_name = "",
      occasion = "Geburtstag",
      relationship = "",
      language = "de",
      tone = "warm",
    } = body ?? {};

    // Optional: auth just to rate-limit (best effort)
    const auth = req.headers.get("Authorization");
    if (auth && SUPABASE_URL && ANON_KEY) {
      try {
        const sb = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: { Authorization: auth } },
        });
        await sb.auth.getUser();
      } catch { /* ignore */ }
    }

    const langLine = language === "de"
      ? "Antworte auf Schweizer Deutsch (kein ß, immer ss)."
      : `Antworte auf ${language}.`;

    const sys = `Du bist ein warmherziger, seelsorgerlicher Bibelbegleiter. ${langLine}
Erzeuge einen kurzen, persönlichen Bibelgruss zum Teilen.
Gib genau JSON zurück:
{
  "title": "Kurzer Titel (max 40 Zeichen)",
  "verse": "Ein passender Bibelvers mit Referenz, z.B. 'Der Herr segne dich und behüte dich. — 4. Mose 6,24'",
  "reflection": "1-2 warme, persönliche Sätze an ${recipient_name || "die Person"}.",
  "share_text": "Zusammengesetzter Gruss (Anrede + Vers + kurze Segenszeile), 3-5 Zeilen, geeignet zum Teilen per WhatsApp/SMS/Email. Kein Markdown."
}
Nur JSON, kein Markdown, keine Erklärungen.`;

    const userMsg = `Empfänger: ${recipient_name || "unbenannt"}${relationship ? ` (${relationship})` : ""}. Anlass: ${occasion}. Ton: ${tone}.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        service_tier: "priority",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return new Response(
        JSON.stringify({ error: "ai_failed", status: resp.status, details: errBody }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { reflection: raw }; }

    const result = {
      title: parsed.title || `Gruss für ${recipient_name || "dich"}`,
      verse: parsed.verse || "",
      reflection: parsed.reflection || "",
      share_text:
        parsed.share_text ||
        [
          recipient_name ? `Liebe/r ${recipient_name},` : "",
          parsed.verse || "",
          parsed.reflection || "",
          "— mit BibleBot.Life",
        ]
          .filter(Boolean)
          .join("\n\n"),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "server_error", message: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
