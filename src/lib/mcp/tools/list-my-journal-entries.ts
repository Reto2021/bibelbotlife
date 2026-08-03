import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_journal_entries",
  title: "Meine Journal-Einträge",
  description: "Listet die eigenen Journal-Einträge (Impuls, Bibelstelle, Stimmung) der angemeldeten Person.",
  inputSchema: {
    limit: z.number().int().optional().describe("Maximale Anzahl Einträge (Standard 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, content, prompt, verse_ref, mood, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(max);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const text = rows.length
      ? rows
          .map((r) => `${new Date(r.created_at as string).toISOString().slice(0, 10)} [${r.mood ?? "-"}] ${r.verse_ref ?? ""} ${r.content}`)
          .join("\n")
      : "Noch keine Journal-Einträge.";
    return { content: [{ type: "text", text }], structuredContent: { entries: rows } };
  },
});
