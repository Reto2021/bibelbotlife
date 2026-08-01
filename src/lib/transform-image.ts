/**
 * Client-side rotate, zoom & crop for the "Kreuzwege" photo upload.
 * Applied before the quote is burned in and before the file is uploaded.
 */

import { decodeImageOriented } from "@/lib/exif-orientation";
export type CropAspect = "original" | "1:1" | "4:5" | "16:9";

export interface ImageEdits {
  /** Clockwise rotation in degrees: 0, 90, 180 or 270. */
  rotation: number;
  aspect: CropAspect;
  /** Manual zoom factor (1 = fit the crop box exactly). */
  zoom?: number;
  /** Manual pan, as a fraction of the crop box width/height. */
  offsetX?: number;
  offsetY?: number;
}

export const CROP_ASPECTS: CropAspect[] = ["original", "1:1", "4:5", "16:9"];

export const MIN_CROP_ZOOM = 1;
export const MAX_CROP_ZOOM = 4;

const ASPECT_RATIOS: Record<CropAspect, number | null> = {
  original: null,
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

/** How far the crop box may be panned before empty edges would appear. */
export function maxCropOffset(zoom: number): number {
  return Math.max(0, (zoom - 1) / 2);
}

export function clampCropOffset(value: number, zoom: number): number {
  const max = maxCropOffset(zoom);
  return Math.min(max, Math.max(-max, value));
}

export function hasImageEdits(edits: ImageEdits): boolean {
  return (
    edits.rotation % 360 !== 0 ||
    edits.aspect !== "original" ||
    (edits.zoom ?? 1) !== 1 ||
    (edits.offsetX ?? 0) !== 0 ||
    (edits.offsetY ?? 0) !== 0
  );
}

/**
 * Rotate, zoom and center-crop an image. Returns a JPEG file, or the input when
 * nothing needs to change or the canvas is unavailable.
 */
export async function applyImageEdits(
  file: File,
  { rotation, aspect, zoom = 1, offsetX = 0, offsetY = 0 }: ImageEdits,
  { maxSize = 1800, quality = 0.92 }: { maxSize?: number; quality?: number } = {},
): Promise<File> {
  if (!hasImageEdits({ rotation, aspect, zoom, offsetX, offsetY })) return file;

  const bitmap = await decodeImageOriented(file);
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

  const safeZoom = Math.min(MAX_CROP_ZOOM, Math.max(MIN_CROP_ZOOM, zoom));
  const panX = clampCropOffset(offsetX, safeZoom) * outW;
  const panY = clampCropOffset(offsetY, safeZoom) * outH;

  // Pan first (in output pixels), then rotate & zoom around the crop centre.
  ctx.translate(outW / 2 + panX, outH / 2 + panY);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(scale * safeZoom, scale * safeZoom);
  // After rotating around the centre, drawing the source centred keeps the crop centred.
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "kreuz";
  return new File([blob], `${name}-edited.jpg`, { type: "image/jpeg" });
}
