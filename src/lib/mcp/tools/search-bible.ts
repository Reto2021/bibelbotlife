import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_bible",
  title: "Bibel durchsuchen",
  description:
    "Volltextsuche in den Bibelübersetzungen von BibleBot.Life. Gibt Buch, Kapitel, Vers, Übersetzung und Verstext zurück.",
  inputSchema: {
    query: z.string().trim().min(2).describe("Suchbegriff oder Phrase, z.B. 'Hoffnung' oder 'Psalm 23'."),
    translation: z
      .string()
      .trim()
      .optional()
      .describe("Optionaler Übersetzungscode, z.B. 'LUT', 'SCH', 'ELB', 'EU', 'ZB'."),
    limit: z.number().int().optional().describe("Maximale Trefferzahl (Standard 10, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, translation, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 10, 1), 50);
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("bible_verses")
      .select("book, chapter, verse, text, translation")
      .textSearch("fts", query, { type: "websearch", config: "german" })
      .limit(max);
    if (translation) q = q.eq("translation", translation);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const text = rows.length
      ? rows.map((r) => `${r.book} ${r.chapter},${r.verse} (${r.translation}): ${r.text}`).join("\n")
      : "Keine Treffer.";
    return { content: [{ type: "text", text }], structuredContent: { verses: rows } };
  },
});
