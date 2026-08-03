import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_crosses",
  title: "Meine Kreuze",
  description:
    "Listet die eigenen hochgeladenen Kreuz-Fotos aus den Kreuzwegen inklusive Status, Ort, Zitat und Freigabe-Link.",
  inputSchema: {
    status: z.string().trim().optional().describe("Optionaler Statusfilter: 'pending', 'approved' oder 'rejected'."),
    limit: z.number().int().optional().describe("Maximale Anzahl (Standard 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Nicht angemeldet." }], isError: true };
    }
    const max = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("cross_posts")
      .select("id, slug, place_label, country, status, quote, quote_reference, amen_count, prayer_count, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(max);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((r) => ({
      ...r,
      url: r.slug ? `https://biblebot.life/kreuzwege/${r.slug}` : null,
    }));
    const text = rows.length
      ? rows.map((r) => `${r.place_label ?? "Ohne Ort"} – ${r.status} – ${r.url ?? "(kein Link)"}`).join("\n")
      : "Noch keine Kreuze hochgeladen.";
    return { content: [{ type: "text", text }], structuredContent: { crosses: rows } };
  },
});
