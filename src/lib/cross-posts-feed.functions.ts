import { createServerFn } from "@tanstack/react-start";

export type CrossPostFeedItem = {
  id: unknown;
  slug: unknown;
  place_label: unknown;
  country: unknown;
  lat: unknown;
  lng: unknown;
  story: unknown;
  quote: unknown;
  quote_reference: unknown;
  quote_burned: unknown;
  author_name: unknown;
  is_anonymous: unknown;
  prayer_count: unknown;
  amen_count: unknown;
  share_count: unknown;
  reported_count: unknown;
  created_at: unknown;
  image_url: string | null;
};

/** Public read-only feed of approved "Kreuzwege" posts with short-lived signed image URLs. */
export const crossPostsFeed = createServerFn({ method: "GET" }).handler(async (): Promise<{ posts: CrossPostFeedItem[] }> => {
  const { createAdminClient } = await import("./supabase-server.server");
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_approved_cross_posts");
  if (error) throw new Error(error.message);

  const posts = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const paths = posts.map((p) => String(p["image_path"]));

  let urlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signErr } = await admin.storage.from("cross-photos").createSignedUrls(paths, 60 * 60);
    if (signErr) throw new Error(signErr.message);
    urlMap = new Map((signed ?? []).map((s) => [String(s.path), s.signedUrl]));
  }

  return {
    posts: posts.map((p) => ({
      id: p["id"],
      slug: p["slug"],
      place_label: p["place_label"],
      country: p["country"],
      lat: p["lat"],
      lng: p["lng"],
      story: p["story"],
      quote: p["quote"] ?? null,
      quote_reference: p["quote_reference"] ?? null,
      quote_burned: p["quote_burned"] ?? false,
      author_name: p["author_name"],
      is_anonymous: p["is_anonymous"],
      prayer_count: p["prayer_count"],
      amen_count: p["amen_count"] ?? 0,
      share_count: p["share_count"] ?? 0,
      reported_count: p["reported_count"] ?? 0,
      created_at: p["created_at"],
      image_url: urlMap.get(String(p["image_path"])) ?? null,
    })),
  };
});
