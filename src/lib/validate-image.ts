/**
 * Validation for the "Kreuzwege" photo upload.
 * Keeps the accepted formats in one place so the input, drop zone and submit
 * path all enforce the same rules.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MIN_IMAGE_DIMENSION = 200;

/** Formats the browser can decode for rotate/crop and the quote overlay. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif"] as const;

/** Formats users often have on their phone but browsers cannot decode. */
const UNSUPPORTED_HINT_TYPES = ["image/heic", "image/heif", "image/tiff"];
const UNSUPPORTED_HINT_EXTENSIONS = ["heic", "heif", "tif", "tiff"];

export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(",");

export type ImageValidationCode =
  | "notAnImage"
  | "unsupportedFormat"
  | "convertHeic"
  | "tooBig"
  | "empty"
  | "unreadable"
  | "tooSmall";

export interface ImageValidationResult {
  ok: boolean;
  code?: ImageValidationCode;
  /** Extra values for the translated message, e.g. the size limit. */
  values?: Record<string, string | number>;
}

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

/** Synchronous checks: MIME type, extension and file size. */
export function validateImageFile(file: File): ImageValidationResult {
  const type = file.type.toLowerCase();
  const ext = extensionOf(file.name);

  if (file.size === 0) return { ok: false, code: "empty" };

  if (UNSUPPORTED_HINT_TYPES.includes(type) || UNSUPPORTED_HINT_EXTENSIONS.includes(ext)) {
    return { ok: false, code: "convertHeic" };
  }

  const typeAllowed = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
  const extAllowed = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);

  if (!type.startsWith("image/") && !extAllowed) {
    return { ok: false, code: "notAnImage" };
  }
  if (!typeAllowed && !extAllowed) {
    return {
      ok: false,
      code: "unsupportedFormat",
      values: { formats: ALLOWED_IMAGE_EXTENSIONS.map((e) => e.toUpperCase()).join(", ") },
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      code: "tooBig",
      values: {
        limit: Math.round(MAX_IMAGE_BYTES / 1024 / 1024),
        size: (file.size / 1024 / 1024).toFixed(1),
      },
    };
  }

  return { ok: true };
}

/**
 * Confirms the file really is a decodable image of usable size.
 * Catches renamed or corrupt files that pass the MIME check.
 */
export async function validateImageContent(file: File): Promise<ImageValidationResult> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, code: "unreadable" };
  }
  const { width, height } = bitmap;
  bitmap.close?.();

  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    return { ok: false, code: "tooSmall", values: { min: MIN_IMAGE_DIMENSION } };
  }
  return { ok: true };
}
