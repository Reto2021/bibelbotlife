import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachSupabaseAuth } from "./supabase-auth-middleware";

const InputSchema = z.object({ limit_messages: z.number().optional() });

/** Distils pastoral memory points from the signed-in user's recent chats. */
export const memoryAutoExtract = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<{ extracted: number; reason?: string }> => {
    const { createAdminClient, requireUser, serverEnv } = await import("./supabase-server.server");
    const user = await requireUser();
    const limit = Math.min(Math.max(Number(data.limit_messages ?? 80), 20), 200);

    const admin = createAdminClient();
    const { data: msgs, error: mErr } = await admin
      .from("chat_messages")
      .select("role, content, created_at, conversation_id, chat_conversations!inner(user_id)")
      .eq("chat_conversations.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (mErr) throw new Error(mErr.message);
    if (!msgs?.length) return { extracted: 0, reason: "no_messages" };

    const transcript = [...msgs]
      .reverse()
      .map((m) => `${m.role === "user" ? "User" : "Bot"}: ${String(m.content ?? "").slice(0, 800)}`)
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
      headers: { "Content-Type": "application/json", "Lovable-API-Key": serverEnv("LOVABLE_API_KEY") },
      body: JSON.stringify({
        model: "openai/gpt-5.4-mini",
        service_tier: "priority",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: transcript },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(`ai_failed (${resp.status})`);

    const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { facts?: Array<{ topic?: string; content?: string }> } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      parsed = {};
    }
    const facts = (parsed.facts ?? []).filter(
      (f): f is { topic?: string; content: string } => !!f && typeof f.content === "string" && f.content.trim().length > 10,
    );
    if (!facts.length) return { extracted: 0 };

    const rows = facts.slice(0, 20).map((f) => ({
      user_id: user.id,
      source: "chat_auto",
      content: f.content.trim().slice(0, 2000),
      topic: (f.topic ?? "").trim().slice(0, 80) || null,
      is_active: true,
    }));

    const { error: iErr } = await admin.from("user_memory").insert(rows);
    if (iErr) throw new Error(iErr.message);
    return { extracted: rows.length };
  });
