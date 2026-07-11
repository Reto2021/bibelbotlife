// Auto-extract seelsorgerliche Memory-Punkte aus den letzten Chats des Users.
// Aufruf: POST { limit_messages?: number } mit Authorization: Bearer <access_token>
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit_messages ?? 80), 20), 200);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: msgs, error: mErr } = await admin
      .from("chat_messages")
      .select("role, content, created_at, conversation_id, chat_conversations!inner(user_id)")
      .eq("chat_conversations.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (mErr) throw mErr;
    if (!msgs?.length) return json({ extracted: 0, reason: "no_messages" });

    const transcript = [...msgs]
      .reverse()
      .map((m: any) => `${m.role === "user" ? "User" : "Bot"}: ${String(m.content ?? "").slice(0, 800)}`)
      .join("\n")
      .slice(0, 20000);

    const sys = `Du destillierst aus einem Chatverlauf zwischen Nutzer und einem seelsorgerlichen Bibelbegleiter eine kompakte, respektvolle Memory für zukünftige Gespräche.
Antworte auf Schweizer Deutsch (kein ß). Extrahiere nur, was der Nutzer explizit über sich preisgegeben hat:
- Lebenssituation, Beziehungen, Beruf
- wiederkehrende Themen, Ängste, Hoffnungen
- Glaubensfragen, bevorzugte Bibelbücher/Verse
- praktische Vorlieben (Sprache, Tonfall)
Keine Diagnosen. Keine Bewertungen. Keine erfundenen Fakten. Wenn nichts Klares hervorgeht, gib eine leere Liste zurück.
Antworte als JSON: {"facts": [{"topic": "kurzes Label", "content": "1-3 Sätze"}]}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        service_tier: "priority",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: transcript },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return json({ error: "ai_failed", status: resp.status, details: t }, resp.status);
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { facts?: Array<{ topic: string; content: string }> } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const facts = (parsed.facts ?? []).filter(
      (f) => f && typeof f.content === "string" && f.content.trim().length > 10,
    );

    if (!facts.length) return json({ extracted: 0 });

    const rows = facts.slice(0, 20).map((f) => ({
      user_id: user.id,
      source: "chat_auto",
      content: f.content.trim().slice(0, 2000),
      topic: (f.topic ?? "").trim().slice(0, 80) || null,
      is_active: true,
    }));

    const { error: iErr } = await admin.from("user_memory").insert(rows);
    if (iErr) throw iErr;

    return json({ extracted: rows.length });
  } catch (e: any) {
    console.error("memory-auto-extract failed", e);
    return json({ error: e?.message ?? "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
