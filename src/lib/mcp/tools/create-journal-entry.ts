import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_journal_entry",
  title: "Journal-Eintrag erstellen",
  description: "Erstellt einen neuen Journal-Eintrag für die angemeldete Person in BibleBot.Life.",
  inputSchema: {
    content: z.string().trim().min(1).describe("Der Text des Eintrags."),
    verse_ref: z.string().trim().optional().describe("Optionale Bibelstelle, z.B. 'Psalm 23,1'."),
    mood: z.string().trim().optional().describe("Optionale Stimmung, z.B. 'dankbar', 'unruhig'."),
    prompt: z.string().trim().optional().describe("Optionale Impulsfrage, auf die der Eintrag antwortet."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ content, verse_ref, mood, prompt }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: ctx.getUserId(), content, verse_ref: verse_ref ?? null, mood: mood ?? null, prompt: prompt ?? null })
      .select("id, content, verse_ref, mood, created_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: "Journal-Eintrag gespeichert." }],
      structuredContent: { entry: data?.[0] },
    };
  },
});
