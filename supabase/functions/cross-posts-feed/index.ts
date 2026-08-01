import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Public read-only feed for approved "Kreuzwege" posts.
// Images live in a private bucket, so we hand out short-lived signed URLs.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin.rpc("get_approved_cross_posts");
    if (error) throw error;

    const posts = (data ?? []) as Array<Record<string, unknown>>;
    const paths = posts.map((p) => String(p.image_path));

    let urlMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed, error: signErr } = await admin.storage
        .from("cross-photos")
        .createSignedUrls(paths, 60 * 60);
      if (signErr) throw signErr;
      urlMap = new Map(
        (signed ?? []).map((s) => [String(s.path), s.signedUrl as string]),
      );
    }

    const result = posts.map((p) => ({
      id: p.id,
      place_label: p.place_label,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      story: p.story,
      quote: p.quote ?? null,
      quote_reference: p.quote_reference ?? null,
      quote_burned: p.quote_burned ?? false,
      author_name: p.author_name,
      is_anonymous: p.is_anonymous,
      prayer_count: p.prayer_count,
      amen_count: p.amen_count ?? 0,
      share_count: p.share_count ?? 0,
      reported_count: p.reported_count ?? 0,
      created_at: p.created_at,
      image_url: urlMap.get(String(p.image_path)) ?? null,
    }));

    return new Response(JSON.stringify({ posts: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cross-posts-feed failed:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
