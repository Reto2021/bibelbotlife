import { decodeImageOriented } from "@/lib/exif-orientation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { burnQuoteIntoImage } from "@/lib/burn-quote";
import { ModerationError, localTextCheck } from "@/lib/moderation";

export type CrossInteraction = "prayer" | "amen" | "share" | "report";

export interface CrossPost {
  id: string;
  place_label: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  story: string | null;
  quote: string | null;
  quote_reference: string | null;
  quote_burned: boolean;
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
  const bitmap = await decodeImageOriented(file);
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
                reported_count: counts.reported_count ?? p.reported_count,
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
  quote?: string;
  quoteReference?: string;
  /** When true the quote is rendered into the uploaded image. */
  burnQuote?: boolean;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function submitCrossPost(input: NewCrossPost) {
  const quote = input.quote?.trim() || "";
  const reference = input.quoteReference?.trim() || "";
  const burned = Boolean(quote) && input.burnQuote !== false;

  const blob = burned
    ? await burnQuoteIntoImage(input.file, { quote, reference })
    : await compressImage(input.file);

  // Fast local text filter; the authoritative checks (file type, size, image and
  // text moderation) all run server side in the cross-post-submit function.
  const local = localTextCheck([
    input.placeLabel,
    input.story ?? "",
    quote,
    reference,
    input.authorName ?? "",
  ]);
  if (local) throw new ModerationError(local);

  const { data, error } = await supabase.functions.invoke("cross-post-submit", {
    body: {
      imageBase64: await blobToBase64(blob),
      placeLabel: input.placeLabel,
      country: input.country ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      story: input.story ?? null,
      authorName: input.authorName ?? null,
      isAnonymous: input.isAnonymous,
      quote,
      quoteReference: reference,
      quoteBurned: burned,
      sessionId: getSessionId(),
    },
  });

  let payload = (data ?? null) as
    | { error?: string; categories?: string[]; reason?: string; id?: string }
    | null;

  if (!payload?.id && error) {
    // Non-2xx responses arrive as FunctionsHttpError; the JSON body carries the reason.
    try {
      payload = await (error as { context?: Response }).context?.json();
    } catch {
      /* keep original error */
    }
  }

  if (payload?.error === "blocked") {
    throw new ModerationError({
      allowed: false,
      categories: payload.categories ?? [],
      reason: payload.reason ?? "",
    });
  }
  if (payload?.error) throw new Error(payload.error);
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


/** A post owned by this browser session (or logged-in account). */
export interface MyCrossPost extends CrossPost {
  image_path: string;
  status: string;
  updated_at: string;
}

async function manage(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("cross-post-manage", {
    body: { action, sessionId: getSessionId(), ...payload },
  });
  let result = (data ?? null) as { error?: string; posts?: MyCrossPost[] } | null;
  if (!result && error) {
    try {
      result = await (error as { context?: Response }).context?.json();
    } catch {
      /* keep original error */
    }
  }
  if (result?.error) throw new Error(result.error);
  if (error) throw error;
  return result;
}

export function useMyCrossPosts() {
  const [posts, setPosts] = useState<MyCrossPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await manage("list");
      setPosts((res?.posts ?? []) as MyCrossPost[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (input: {
      id: string;
      placeLabel: string;
      story?: string | null;
      quote?: string | null;
      quoteReference?: string | null;
      authorName?: string | null;
      isAnonymous: boolean;
    }) => {
      await manage("update", input);
      await load();
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await manage("delete", { id });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    },
    [],
  );

  return { posts, loading, reload: load, update, remove };
}
