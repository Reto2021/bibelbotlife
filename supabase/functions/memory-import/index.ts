// Imports raw memory markdown (from ChatGPT/Claude/Gemini exports), distills
// it into a compact profile, and stores it in public.user_memory scoped to
// the caller. Auth: user JWT required.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

const SYSTEM = `Du destillierst persönliche KI-Gedächtnis-Exporte (aus ChatGPT, Claude oder Gemini) in ein kompaktes, seelsorgerlich nutzbares Profil.

Regeln:
- Max. 2000 Wörter.
- Deutsch (Schweizerdeutsch-Standard, kein ß, immer "ss").
- Struktur mit Markdown-Headings: ## Lebenssituation, ## Werte & Glaube, ## Themen die ihn/sie bewegen, ## Bevorzugte Kommunikation, ## Sensible Themen.
- Keine sensiblen Roh-Daten (Passwörter, Adressen, Kontodaten). Filtere sie aus.
- Nur was für einen Bibel-Begleiter nützlich ist.
- Fakten, keine Bewertungen.
- Wenn Input leer/unbrauchbar: gib "KEIN_INHALT" zurück.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, source } = await req.json();
    if (typeof content !== "string" || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: "content required (min 20 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (content.length > 200000) {
      return new Response(JSON.stringify({ error: "content too large (max 200k chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const src = ["gpt", "claude", "gemini", "manual"].includes(source) ? source : "manual";

    // Truncate very long inputs before sending to the model
    const trimmed = content.slice(0, 60000);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        service_tier: "priority",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: trimmed },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: "ai_failed", detail: errText }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const distilled: string = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!distilled || distilled === "KEIN_INHALT" || distilled.length < 40) {
      return new Response(JSON.stringify({ error: "no_useful_content" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalContent = distilled.slice(0, 20000);

    const userSb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userSb.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insErr } = await userSb
      .from("user_memory")
      .insert({
        user_id: userData.user.id,
        content: finalContent,
        source: src,
      })
      .select()
      .single();

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ memory: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
