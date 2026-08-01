/**
 * Client-side rotate & crop for the "Kreuzwege" photo upload.
 * Applied before the quote is burned in and before the file is uploaded.
 */

export type CropAspect = "original" | "1:1" | "4:5" | "16:9";

export interface ImageEdits {
  /** Clockwise rotation in degrees: 0, 90, 180 or 270. */
  rotation: number;
  aspect: CropAspect;
}

export const CROP_ASPECTS: CropAspect[] = ["original", "1:1", "4:5", "16:9"];

const ASPECT_RATIOS: Record<CropAspect, number | null> = {
  original: null,
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

export function hasImageEdits(edits: ImageEdits): boolean {
  return edits.rotation % 360 !== 0 || edits.aspect !== "original";
}

/**
 * Rotate and center-crop an image. Returns a JPEG file, or the input when
 * nothing needs to change or the canvas is unavailable.
 */
export async function applyImageEdits(
  file: File,
  { rotation, aspect }: ImageEdits,
  { maxSize = 1800, quality = 0.92 }: { maxSize?: number; quality?: number } = {},
): Promise<File> {
  if (!hasImageEdits({ rotation, aspect })) return file;

  const bitmap = await createImageBitmap(file);
  const angle = ((rotation % 360) + 360) % 360;
  const swap = angle === 90 || angle === 270;
  const rotatedW = swap ? bitmap.height : bitmap.width;
  const rotatedH = swap ? bitmap.width : bitmap.height;

  // Target crop box (centered) in rotated coordinates.
  const ratio = ASPECT_RATIOS[aspect];
  let cropW = rotatedW;
  let cropH = rotatedH;
  if (ratio) {
    if (rotatedW / rotatedH > ratio) {
      cropH = rotatedH;
      cropW = Math.round(rotatedH * ratio);
    } else {
      cropW = rotatedW;
      cropH = Math.round(rotatedW / ratio);
    }
  }

  const scale = Math.min(1, maxSize / Math.max(cropW, cropH));
  const outW = Math.max(1, Math.round(cropW * scale));
  const outH = Math.max(1, Math.round(cropH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(scale, scale);
  // After rotating around the centre, drawing the source centred keeps the crop centred.
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "kreuz";
  return new File([blob], `${name}-edited.jpg`, { type: "image/jpeg" });
}
