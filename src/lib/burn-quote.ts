/**
 * Renders a quote (and optional reference) into the lower part of an image.
 * Used for the "Kreuzwege" upload: the quote stays visible when the photo is shared.
 */

import { decodeImageOriented } from "@/lib/exif-orientation";
export interface BurnQuoteOptions {
  quote: string;
  reference?: string;
  maxSize?: number;
  quality?: number;
}

/** Wrap text into lines that fit `maxWidth` for the current canvas font. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Max characters we allow on a photo, so the motif stays visible. */
export const MAX_BURN_QUOTE_LENGTH = 140;

/** Shorten a quote at a word boundary so it never overflows the photo. */
export function truncateQuote(text: string, max = MAX_BURN_QUOTE_LENGTH): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:–-]+$/, "")}…`;
}

/** Wrap the quote in typographic quotation marks, unless it already has them. */
export function withQuotationMarks(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/^[„"»“].*[“"«”]$/.test(trimmed)) return trimmed;
  return `\u201E${trimmed}\u201C`;
}

/**
 * Draw the image with the quote burned in and return a JPEG blob.
 * Falls back to a plain re-encode when the quote is empty.
 */
export async function burnQuoteIntoImage(
  file: File | Blob,
  { quote, reference, maxSize = 1600, quality = 0.9 }: BurnQuoteOptions,
): Promise<Blob> {
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

  const text = withQuotationMarks(truncateQuote(quote));
  if (text) {
    const padding = Math.round(w * 0.06);
    const maxTextWidth = w - padding * 2;
    // The quote block may never eat more than ~38% of the photo height.
    const maxBlockHeight = h * 0.38;

    // Shrink the font until the quote fits into the allowed block.
    let fontSize = Math.round(w * 0.058);
    const minFontSize = Math.max(10, Math.round(w * 0.022));
    let lines: string[] = [];
    for (let i = 0; i < 16; i += 1) {
      ctx.font = `600 ${fontSize}px Barlow, system-ui, sans-serif`;
      lines = wrapLines(ctx, text, maxTextWidth);
      const fits = lines.length <= 6 && lines.length * fontSize * 1.28 <= maxBlockHeight;
      if (fits || fontSize <= minFontSize) break;
      fontSize = Math.max(minFontSize, Math.round(fontSize * 0.9));
    }

    // Last resort: cut at a word boundary instead of overflowing the canvas.
    const maxLines = Math.max(2, Math.min(6, Math.floor(maxBlockHeight / (fontSize * 1.28))));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s.,;:–-]+$/, "")}…\u201C`;
    }

    const lineHeight = Math.round(fontSize * 1.28);
    const refSize = Math.round(fontSize * 0.62);
    const refHeight = reference?.trim() ? Math.round(refSize * 1.7) : 0;
    const blockHeight = lines.length * lineHeight + refHeight + padding * 1.6;

    // Soft gradient so light photos stay readable.
    const gradientTop = Math.max(0, h - blockHeight - padding);
    const gradient = ctx.createLinearGradient(0, gradientTop, 0, h);
    gradient.addColorStop(0, "rgba(12, 10, 8, 0)");
    gradient.addColorStop(0.45, "rgba(12, 10, 8, 0.55)");
    gradient.addColorStop(1, "rgba(12, 10, 8, 0.88)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, gradientTop, w, h - gradientTop);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = Math.round(fontSize * 0.35);

    let y = h - padding - refHeight - (lines.length - 1) * lineHeight;
    ctx.font = `600 ${fontSize}px Barlow, system-ui, sans-serif`;
    ctx.fillStyle = "#ffffff";
    for (const line of lines) {
      ctx.fillText(line, padding, y);
      y += lineHeight;
    }

    if (reference?.trim()) {
      ctx.font = `500 ${refSize}px Barlow, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
      ctx.fillText(reference.trim(), padding, h - padding + refSize * 0.2);
    }

    ctx.shadowBlur = 0;
  }

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? (file as Blob)), "image/jpeg", quality),
  );
}
