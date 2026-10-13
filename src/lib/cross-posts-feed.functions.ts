import { createServerFn } from "@tanstack/react-start";

type FeedValue = string | number | boolean | null;

export type CrossPostFeedItem = Record<
  | "id" | "slug" | "place_label" | "country" | "lat" | "lng" | "story" | "quote" | "quote_reference"
  | "quote_burned" | "author_name" | "is_anonymous" | "prayer_count" | "amen_count" | "share_count"
  | "reported_count" | "created_at",
  FeedValue
> & { image_url: string | null };

const v = (x: unknown): FeedValue =>
  x === null || x === undefined ? null : typeof x === "string" || typeof x === "number" || typeof x === "boolean" ? x : String(x);

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
    urlMap = new Map((signed ?? []).flatMap((s) => (s.signedUrl ? [[String(s.path), s.signedUrl] as const] : [])));
  }

  return {
    posts: posts.map((p) => ({
      id: v(p["id"]),
      slug: v(p["slug"]),
      place_label: v(p["place_label"]),
      country: v(p["country"]),
      lat: v(p["lat"]),
      lng: v(p["lng"]),
      story: v(p["story"]),
      quote: v(p["quote"]),
      quote_reference: v(p["quote_reference"]),
      quote_burned: v(p["quote_burned"] ?? false),
      author_name: v(p["author_name"]),
      is_anonymous: v(p["is_anonymous"]),
      prayer_count: v(p["prayer_count"]),
      amen_count: v(p["amen_count"] ?? 0),
      share_count: v(p["share_count"] ?? 0),
      reported_count: v(p["reported_count"] ?? 0),
      created_at: v(p["created_at"]),
      image_url: urlMap.get(String(p["image_path"])) ?? null,
    })),
  };
});
