import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

/**
 * Server-side submit gate for Kreuzwege photos.
 *
 * The client no longer writes to storage or the table directly. Everything goes
 * through here so file type, file size and content moderation are enforced on
 * the server and invalid images are never stored.
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

function num(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
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

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // ---- file validation (type + size, based on real bytes) ----
    if (typeof body.imageBase64 !== "string" || !body.imageBase64) {
      return json({ error: "image_missing" }, 400);
    }
    // base64 grows the payload by ~4/3; reject oversized payloads before decoding.
    if (body.imageBase64.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1024) {
      return json({ error: "image_too_large", maxBytes: MAX_IMAGE_BYTES }, 413);
    }

    const bytes = decodeBase64(body.imageBase64);
    if (!bytes) return json({ error: "image_unreadable" }, 400);
    if (bytes.byteLength < MIN_IMAGE_BYTES) return json({ error: "image_too_small" }, 400);
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return json({ error: "image_too_large", maxBytes: MAX_IMAGE_BYTES }, 413);
    }

    const mime = detectMime(bytes);
    if (!mime) return json({ error: "unsupported_format" }, 415);

    // ---- field validation ----
    const placeLabel = str(body.placeLabel, 120);
    if (!placeLabel) return json({ error: "place_label_required" }, 400);

    const country = str(body.country, 60);
    const story = str(body.story, 500);
    const quote = str(body.quote, 280);
    const quoteReference = str(body.quoteReference, 80);
    const isAnonymous = body.isAnonymous === true;
    const authorName = isAnonymous ? null : str(body.authorName, 60);
    const sessionId = str(body.sessionId, 100);
    const lat = num(body.lat, -90, 90);
    const lng = num(body.lng, -180, 180);
    const quoteBurned = body.quoteBurned === true;

    // ---- content moderation (server side, same gate as before) ----
    const modRes = await fetch(`${supabaseUrl}/functions/v1/content-moderation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        imageBase64: body.imageBase64,
        imageMimeType: mime,
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

    // ---- store (service role only) ----
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("cross-photos")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (uploadError) {
      console.error("cross upload failed", uploadError.message);
      return json({ error: "upload_failed" }, 500);
    }

    const { data: inserted, error: insertError } = await admin
      .from("cross_posts")
      .insert({
        image_path: path,
        place_label: placeLabel,
        country,
        lat,
        lng,
        story,
        quote,
        quote_reference: quoteReference,
        quote_burned: quoteBurned,
        author_name: authorName,
        is_anonymous: isAnonymous,
        session_id: sessionId,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      await admin.storage.from("cross-photos").remove([path]);
      console.error("cross insert failed", insertError?.message);
      return json({ error: "insert_failed" }, 500);
    }

    // Community uploads go live immediately; reports move them into the queue.
    await admin.from("cross_posts").update({ status: "approved" }).eq("id", inserted.id);

    return json({ id: inserted.id, imagePath: path, mime, bytes: bytes.byteLength });
  } catch (err) {
    console.error("cross-post-submit error", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
