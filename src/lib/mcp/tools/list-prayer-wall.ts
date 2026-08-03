import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_prayer_wall",
  title: "Gebetswand lesen",
  description: "Liest die freigegebenen, öffentlichen Gebetsanliegen der Gebetswand von BibleBot.Life.",
  inputSchema: {
    limit: z.number().int().optional().describe("Maximale Anzahl Anliegen (Standard 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("id, content, author_name, is_anonymous, prayer_count, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(max);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const text = rows.length
      ? rows
          .map(
            (r) =>
              `${r.is_anonymous ? "Anonym" : r.author_name ?? "Anonym"} (${r.prayer_count ?? 0} Gebete): ${r.content}`,
          )
          .join("\n")
      : "Keine freigegebenen Anliegen.";
    return { content: [{ type: "text", text }], structuredContent: { requests: rows } };
  },
});
