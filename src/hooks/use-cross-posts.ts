import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
  image_url: string | null;
}

const PRAYED_KEY = "biblebot-crosses-prayed";

function getSessionId() {
  let id = localStorage.getItem("biblebot-session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("biblebot-session", id);
  }
  return id;
}

function readPrayed(): Set<string> {
  try {
    const raw = localStorage.getItem(PRAYED_KEY);
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
  const [prayed, setPrayed] = useState<Set<string>>(() => readPrayed());

  const load = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("cross-posts-feed");
    if (!error && data?.posts) setPosts(data.posts as CrossPost[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pray = useCallback(
    async (id: string) => {
      if (prayed.has(id)) return;
      const next = new Set(prayed);
      next.add(id);
      setPrayed(next);
      localStorage.setItem(PRAYED_KEY, JSON.stringify([...next]));
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, prayer_count: p.prayer_count + 1 } : p)),
      );
      await supabase.rpc("increment_cross_prayer_count" as any, { post_id: id });
    },
    [prayed],
  );

  return { posts, loading, prayed, pray, reload: load };
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
