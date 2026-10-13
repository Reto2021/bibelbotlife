import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  recipient_name: z.string().max(200).optional(),
  occasion: z.string().max(200).optional(),
  relationship: z.string().max(200).optional(),
  language: z.string().max(20).optional(),
  tone: z.string().max(50).optional(),
});

export type BibleGreeting = { title: string; verse: string; reflection: string; share_text: string };

/** Short, personal Bible greeting (birthdays, anniversaries) ready to share. */
export const bibleGreeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<BibleGreeting> => {
    const { serverEnv } = await import("./supabase-server.server");
    const recipientName = data.recipient_name ?? "";
    const occasion = data.occasion || "Geburtstag";
    const relationship = data.relationship ?? "";
    const language = data.language || "de";
    const tone = data.tone || "warm";

    const langLine = language === "de" ? "Antworte auf Schweizer Deutsch (kein ß, immer ss)." : `Antworte auf ${language}.`;

    const sys = `Du bist ein warmherziger, seelsorgerlicher Bibelbegleiter. ${langLine}
Erzeuge einen kurzen, persönlichen Bibelgruss zum Teilen.
Gib genau JSON zurück:
{
  "title": "Kurzer Titel (max 40 Zeichen)",
  "verse": "Ein passender Bibelvers mit Referenz, z.B. 'Der Herr segne dich und behüte dich. — 4. Mose 6,24'",
  "reflection": "1-2 warme, persönliche Sätze an ${recipientName || "die Person"}.",
  "share_text": "Zusammengesetzter Gruss (Anrede + Vers + kurze Segenszeile), 3-5 Zeilen, geeignet zum Teilen per WhatsApp/SMS/Email. Kein Markdown."
}
Nur JSON, kein Markdown, keine Erklärungen.`;

    const userMsg = `Empfänger: ${recipientName || "unbenannt"}${relationship ? ` (${relationship})` : ""}. Anlass: ${occasion}. Ton: ${tone}.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serverEnv("LOVABLE_API_KEY")}` },
      body: JSON.stringify({
        model: "openai/gpt-5.4-mini",
        service_tier: "priority",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) throw new Error(`ai_failed (${resp.status})`);

    const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<BibleGreeting> = {};
    try {
      parsed = JSON.parse(raw) as Partial<BibleGreeting>;
    } catch {
      parsed = { reflection: raw };
    }

    return {
      title: parsed.title || `Gruss für ${recipientName || "dich"}`,
      verse: parsed.verse || "",
      reflection: parsed.reflection || "",
      share_text:
        parsed.share_text ||
        [recipientName ? `Liebe/r ${recipientName},` : "", parsed.verse || "", parsed.reflection || "", "— mit BibleBot.Life"]
          .filter(Boolean)
          .join("\n\n"),
    };
  });
