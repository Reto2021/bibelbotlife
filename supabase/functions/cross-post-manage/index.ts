import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * Owner self-service for "Kreuzwege" posts: list, edit, delete.
 *
 * Ownership is proven either by the anonymous browser session id that was sent
 * with the upload, or by a validated bearer token (logged-in users). All writes
 * happen with the service role; the client never touches storage or the table.
 */

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const action = str(body.action, 20);
    if (!action || !["list", "update", "delete"].includes(action)) {
      return json({ error: "invalid_action" }, 400);
    }

    const sessionId = str(body.sessionId, 100);

    // Resolve the signed-in user from the bearer token (never from the body).
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token && token !== anonKey) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      });
      const { data } = await authClient.auth.getUser();
      userId = data?.user?.id ?? null;
    }

    if (!sessionId && !userId) return json({ error: "no_identity" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    /** Restricts a query to rows owned by this session and/or user. */
    const ownerFilter = () => {
      const parts: string[] = [];
      if (sessionId) parts.push(`session_id.eq.${sessionId}`);
      if (userId) parts.push(`user_id.eq.${userId}`);
      return parts.join(",");
    };

    if (action === "list") {
      const { data, error } = await admin
        .from("cross_posts")
        .select(
          "id,slug,image_path,place_label,country,lat,lng,story,quote,quote_reference,quote_burned,author_name,is_anonymous,status,prayer_count,amen_count,share_count,reported_count,created_at,updated_at",
        )
        .or(ownerFilter())
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = data ?? [];
      let urlMap = new Map<string, string>();
      if (rows.length > 0) {
        const { data: signed } = await admin.storage
          .from("cross-photos")
          .createSignedUrls(rows.map((r) => r.image_path as string), 60 * 60);
        urlMap = new Map(
          (signed ?? [])
            .filter((s) => s.signedUrl)
            .map((s) => [String(s.path), s.signedUrl as string]),
        );
      }

      return json({
        posts: rows.map((r) => ({
          ...r,
          image_url: urlMap.get(String(r.image_path)) ?? null,
        })),
      });
    }

    const id = str(body.id, 40);
    if (!id) return json({ error: "id_required" }, 400);

    const { data: owned, error: ownErr } = await admin
      .from("cross_posts")
      .select("id,image_path")
      .eq("id", id)
      .or(ownerFilter())
      .maybeSingle();
    if (ownErr) throw ownErr;
    if (!owned) return json({ error: "not_found" }, 404);

    if (action === "delete") {
      await admin.storage.from("cross-photos").remove([owned.image_path as string]);
      await admin.from("cross_interactions").delete().eq("post_id", id);
      const { error } = await admin.from("cross_posts").delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true, deleted: id });
    }

    // ---- update ----
    const placeLabel = str(body.placeLabel, 120);
    if (!placeLabel) return json({ error: "place_label_required" }, 400);
    const story = str(body.story, 500);
    const quote = str(body.quote, 280);
    const quoteReference = str(body.quoteReference, 80);
    const isAnonymous = body.isAnonymous === true;
    const authorName = isAnonymous ? null : str(body.authorName, 60);

    // Re-run text moderation on edited content.
    const modRes = await fetch(`${supabaseUrl}/functions/v1/content-moderation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        texts: [placeLabel, story ?? "", quote ?? "", quoteReference ?? "", authorName ?? ""],
      }),
    });
    if (modRes.ok) {
      const verdict = await modRes.json().catch(() => null);
      if (verdict && verdict.allowed === false) {
        return json(
          { error: "blocked", categories: verdict.categories ?? [], reason: verdict.reason ?? "" },
          422,
        );
      }
    }

    const { error: updErr } = await admin
      .from("cross_posts")
      .update({
        place_label: placeLabel,
        story,
        quote,
        quote_reference: quoteReference,
        author_name: authorName,
        is_anonymous: isAnonymous,
      })
      .eq("id", id);
    if (updErr) throw updErr;

    return json({ ok: true, id });
  } catch (err) {
    console.error("cross-post-manage error", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
