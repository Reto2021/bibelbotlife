import { supabase } from "@/integrations/supabase/client";

export type ModerationCategory =
  | "sexual"
  | "hate"
  | "violence"
  | "csam"
  | "spam"
  | (string & {});

export interface ModerationVerdict {
  allowed: boolean;
  categories: ModerationCategory[];
  reason: string;
}

/** Quick client-side word filter so obvious cases never leave the device. */
const BLOCKED_PATTERNS: RegExp[] = [
  /\bporno?(graf|graph)?\w*/i,
  /\bsex(cam|chat|video|tape)\w*/i,
  /\bnudes?\b/i,
  /\bonlyfans\b/i,
  /\bn[i1]gg(er|a)\w*/i,
  /\bneger\w*/i,
  /\bkanake\w*/i,
  /\bjude?nsau\b/i,
  /\bsieg heil\b/i,
  /\bheil hitler\b/i,
  /\b88\s*(heil)?\b(?=\s*(heil|hitler))/i,
  /\bwhite power\b/i,
  /\buntermensch\w*/i,
  /\bausl[äa]nder raus\b/i,
];

export function localTextCheck(texts: string[]): ModerationVerdict | null {
  const joined = texts.filter(Boolean).join(" \n ");
  if (!joined.trim()) return null;
  const hit = BLOCKED_PATTERNS.some((re) => re.test(joined));
  if (!hit) return null;
  return {
    allowed: false,
    categories: ["hate", "sexual"],
    reason: "blocked term",
  };
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

/**
 * Checks an image and/or texts for pornographic and racist content.
 * Fails open on network/infra errors so legitimate uploads are not lost.
 */
export async function moderateSubmission(input: {
  image?: Blob;
  texts?: string[];
}): Promise<ModerationVerdict> {
  const texts = (input.texts ?? []).filter((t) => t && t.trim().length > 0);

  const local = localTextCheck(texts);
  if (local) return local;

  try {
    const payload: Record<string, unknown> = { texts };
    if (input.image) {
      payload.imageBase64 = await blobToBase64(input.image);
      payload.imageMimeType = input.image.type || "image/jpeg";
    }

    const { data, error } = await supabase.functions.invoke("content-moderation", {
      body: payload,
    });
    if (error || !data) return { allowed: true, categories: [], reason: "" };

    return {
      allowed: (data as ModerationVerdict).allowed !== false,
      categories: (data as ModerationVerdict).categories ?? [],
      reason: (data as ModerationVerdict).reason ?? "",
    };
  } catch {
    return { allowed: true, categories: [], reason: "" };
  }
}

export class ModerationError extends Error {
  categories: ModerationCategory[];
  constructor(verdict: ModerationVerdict) {
    super(verdict.reason || "content rejected");
    this.name = "ModerationError";
    this.categories = verdict.categories;
  }
}
