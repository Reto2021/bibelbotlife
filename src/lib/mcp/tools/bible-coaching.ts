import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "bible_coaching",
  title: "Bibel-Coaching",
  description:
    "Holt zu einem Lebensthema oder einer Stimmung passende Bibelstellen und gibt einen kurzen Coaching-Rahmen (PERMA, Logotherapie, Dankbarkeit, Vergebung) zurück. Keine Diagnose, sondern seelsorgerliche Orientierung.",
  inputSchema: {
    topic: z
      .string()
      .trim()
      .min(2)
      .describe("Lebensthema oder Frage, z.B. 'Angst vor der Zukunft' oder 'Dankbarkeit stärken'."),
    mood: z
      .string()
      .trim()
      .optional()
      .describe("Optionale Stimmung, z.B. 'ängstlich', 'dankbar', 'einsam', 'motiviert'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ topic, mood }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const searchTerms = [topic, mood].filter(Boolean).join(" ");

    const { data, error } = await supabase
      .from("bible_verses")
      .select("book, chapter, verse, text, translation")
      .textSearch("fts", searchTerms, { type: "websearch", config: "german" })
      .limit(5);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = data ?? [];
    const versesText = rows.length
      ? rows.map((r) => `${r.book} ${r.chapter},${r.verse} (${r.translation}): ${r.text}`).join("\n")
      : "Keine direkten Bibeltreffer.";

    const framework = [
      "Coaching-Rahmen:",
      "- Positive Emotion: Was lässt dich heute dankbar werden?",
      "- Engagement: Wo findest du Halt und Sinn? (Logotherapie)",
      "- Relationships: Wer steht an deiner Seite?",
      "- Meaning: Welchen kleinen Schritt kannst du heute gehen?",
      "- Accomplishment: Was ist schon gelungen?",
      "",
      "Passende Bibelstellen:",
      versesText,
      "",
      "Hinweis: BibleBot ersetzt keine professionelle Beratung. Bei akuten Krisen wende dich an die Telefonseelsorge (CH 143, DE/AT 0800 111 0 111).",
    ].join("\n");

    return { content: [{ type: "text", text: framework }], structuredContent: { verses: rows, topic, mood } };
  },
});
