import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CrossInteraction = "prayer" | "amen" | "share" | "report";

export interface CrossPost {
  id: string;
  place_label: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  story: string | null;
  author_name: string | null;
  is_anonymous: boolean;
  prayer_count: number;
  amen_count: number;
  share_count: number;
  reported_count: number;
  created_at: string;
  image_url: string | null;
}

const REACTED_KEY = "biblebot-crosses-reactions";

function getSessionId() {
  let id = localStorage.getItem("biblebot-session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("biblebot-session", id);
  }
  return id;
}

/** Map of `${postId}:${kind}` → true for interactions already sent from this device. */
function readReacted(): Set<string> {
  try {
    const raw = localStorage.getItem(REACTED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Downscale + re-encode to JPEG so uploads stay small. */
export async function compressImage(file: File, maxSize = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85),
  );
}

export function useCrossPosts() {
  const [posts, setPosts] = useState<CrossPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reacted, setReacted] = useState<Set<string>>(() => readReacted());

  const load = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("cross-posts-feed");
    if (!error && data?.posts) setPosts(data.posts as CrossPost[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasReacted = useCallback(
    (id: string, kind: CrossInteraction) => reacted.has(`${id}:${kind}`),
    [reacted],
  );

  const react = useCallback(
    async (id: string, kind: CrossInteraction) => {
      const key = `${id}:${kind}`;
      if (reacted.has(key)) return;

      const next = new Set(reacted);
      next.add(key);
      setReacted(next);
      localStorage.setItem(REACTED_KEY, JSON.stringify([...next]));

      const { data, error } = await supabase.rpc("record_cross_interaction" as any, {
        p_post_id: id,
        p_session_id: getSessionId(),
        p_kind: kind,
      });

      const counts = Array.isArray(data) ? (data[0] as any) : null;
      if (error || !counts) return;

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                prayer_count: counts.prayer_count ?? p.prayer_count,
                amen_count: counts.amen_count ?? p.amen_count,
                share_count: counts.share_count ?? p.share_count,
              }
            : p,
        ),
      );
    },
    [reacted],
  );

  return { posts, loading, hasReacted, react, reload: load };
}


export interface NewCrossPost {
  file: File;
  placeLabel: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  story?: string;
  authorName?: string;
  isAnonymous: boolean;
}

export async function submitCrossPost(input: NewCrossPost) {
  const blob = await compressImage(input.file);
  const path = `${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("cross-photos")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("cross_posts" as any).insert({
    image_path: path,
    place_label: input.placeLabel.trim(),
    country: input.country?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    story: input.story?.trim() || null,
    author_name: input.isAnonymous ? null : input.authorName?.trim() || null,
    is_anonymous: input.isAnonymous,
    session_id: getSessionId(),
    status: "pending",
    prayer_count: 0,
  } as any);
  if (error) throw error;
}

/** Haversine distance in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
