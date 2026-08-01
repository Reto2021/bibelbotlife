import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * Owner self-service for "Kreuzwege" posts: list, edit (incl. photo replace), delete.
 *
 * Ownership is proven either by the anonymous browser session id that was sent
 * with the upload, or by a validated bearer token (logged-in users). All writes
 * happen with the service role; the client never touches storage or the table.
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_BYTES = 1024;

type Sig = { mime: string; test: (b: Uint8Array) => boolean };

const SIGNATURES: Sig[] = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    mime: "image/avif",
    test: (b) =>
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
      String.fromCharCode(b[8], b[9], b[10], b[11]).startsWith("av"),
  },
  {
    mime: "image/gif",
    test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
];

/** Detects the real image type from the file's magic bytes. */
function detectMime(bytes: Uint8Array): string | null {
  if (bytes.length < 16) return null;
  for (const sig of SIGNATURES) {
    if (sig.test(bytes)) return sig.mime;
  }
  return null;
}

function decodeBase64(input: string): Uint8Array | null {
  try {
    const clean = input.includes(",") ? input.slice(input.indexOf(",") + 1) : input;
    const binary = atob(clean);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

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
    const quoteBurned = body.quoteBurned === true;

    // ---- optional photo replacement ----
    let newBytes: Uint8Array | null = null;
    let newMime: string | null = null;
    if (typeof body.imageBase64 === "string" && body.imageBase64) {
      if (body.imageBase64.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1024) {
        return json({ error: "image_too_large", maxBytes: MAX_IMAGE_BYTES }, 413);
      }
      newBytes = decodeBase64(body.imageBase64);
      if (!newBytes) return json({ error: "image_unreadable" }, 400);
      if (newBytes.byteLength < MIN_IMAGE_BYTES) return json({ error: "image_too_small" }, 400);
      if (newBytes.byteLength > MAX_IMAGE_BYTES) {
        return json({ error: "image_too_large", maxBytes: MAX_IMAGE_BYTES }, 413);
      }
      newMime = detectMime(newBytes);
      if (!newMime) return json({ error: "unsupported_format" }, 415);
    }

    // Re-run moderation on edited content (image included when replaced).
    const modRes = await fetch(`${supabaseUrl}/functions/v1/content-moderation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        texts: [placeLabel, story ?? "", quote ?? "", quoteReference ?? "", authorName ?? ""],
        ...(newMime ? { imageBase64: body.imageBase64, imageMimeType: newMime } : {}),
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

    // Upload the replacement under a fresh path so caches/CDN never serve the old photo.
    let newPath: string | null = null;
    if (newBytes && newMime) {
      const ext = newMime === "image/jpeg" ? "jpg" : newMime.split("/")[1];
      newPath = `${id}-${Date.now()}.${ext}`;
      const { error: upErr } = await admin.storage
        .from("cross-photos")
        .upload(newPath, newBytes, { contentType: newMime, upsert: false });
      if (upErr) {
        console.error("cross replace upload failed", upErr.message);
        return json({ error: "upload_failed" }, 500);
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
        ...(newPath ? { image_path: newPath, quote_burned: quoteBurned } : {}),
      })
      .eq("id", id);
    if (updErr) {
      if (newPath) await admin.storage.from("cross-photos").remove([newPath]);
      throw updErr;
    }

    // Old file only goes away once the row points at the new one.
    if (newPath && owned.image_path && owned.image_path !== newPath) {
      await admin.storage.from("cross-photos").remove([owned.image_path as string]);
    }

    let imageUrl: string | null = null;
    if (newPath) {
      const { data: signed } = await admin.storage
        .from("cross-photos")
        .createSignedUrl(newPath, 60 * 60);
      imageUrl = signed?.signedUrl ?? null;
    }

    return json({ ok: true, id, imagePath: newPath, imageUrl });
  } catch (err) {
    console.error("cross-post-manage error", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
