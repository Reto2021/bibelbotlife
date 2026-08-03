import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_bible_moments",
  title: "Meine Bibel-Momente",
  description:
    "Listet die konfigurierten Bibel-Momente (Trigger, Kanal, Sprache, Ruhezeiten) der angemeldeten Person.",
  inputSchema: {
    only_active: z.boolean().optional().describe("Nur aktive Momente zurückgeben (Standard true)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_active }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("bible_moments")
      .select("id, trigger_type, label, delivery_channel, language, active, next_eligible_at, last_delivered_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(50);
    if (only_active !== false) q = q.eq("active", true);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const text = rows.length
      ? rows
          .map((r) => `${r.label ?? r.trigger_type} – ${r.trigger_type} – ${r.delivery_channel} – ${r.active ? "aktiv" : "inaktiv"}`)
          .join("\n")
      : "Keine Bibel-Momente konfiguriert.";
    return { content: [{ type: "text", text }], structuredContent: { moments: rows } };
  },
});
