/**
 * EXIF orientation handling for photo uploads.
 *
 * Phone cameras often store the picture unrotated plus an EXIF orientation flag.
 * Browsers honour that flag for <img> tags, but NOT when a bitmap is drawn onto
 * a canvas — which is exactly what rotate/crop, the quote burn-in and the final
 * compression do. Without normalisation the preview looks upright while the
 * uploaded file ends up sideways (or the other way round).
 *
 * Strategy: decode with `imageOrientation: "from-image"` everywhere, and bake
 * the orientation into the pixels once when the file is picked.
 */

/** Reads the EXIF orientation value (1-8) from a JPEG. Returns 1 when absent. */
export async function readExifOrientation(file: File | Blob): Promise<number> {
  if (!/^image\/(jpeg|pjpeg)$/i.test(file.type)) return 1;
  try {
    // The EXIF block sits near the start of the file.
    const head = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
    if (head.byteLength < 4 || head.getUint16(0) !== 0xffd8) return 1;

    let offset = 2;
    while (offset + 4 <= head.byteLength) {
      const marker = head.getUint16(offset);
      if (marker === 0xffe1) {
        const exifStart = offset + 4;
        if (head.getUint32(exifStart) !== 0x45786966) return 1; // "Exif"
        const tiff = exifStart + 6;
        const little = head.getUint16(tiff) === 0x4949;
        const ifd = tiff + head.getUint32(tiff + 4, little);
        const entries = head.getUint16(ifd, little);
        for (let i = 0; i < entries; i += 1) {
          const entry = ifd + 2 + i * 12;
          if (head.getUint16(entry, little) === 0x0112) {
            const value = head.getUint16(entry + 8, little);
            return value >= 1 && value <= 8 ? value : 1;
          }
        }
        return 1;
      }
      if ((marker & 0xff00) !== 0xff00) return 1;
      offset += 2 + head.getUint16(offset + 2);
    }
  } catch {
    /* unreadable EXIF → treat as upright */
  }
  return 1;
}

/**
 * Decodes an image with EXIF orientation already applied, so canvas output
 * matches what the user sees in the preview.
 */
export async function decodeImageOriented(file: File | Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Older browsers ignore the option or reject unknown options.
    return await createImageBitmap(file);
  }
}

/**
 * Returns a file whose pixels are already rotated according to EXIF, with the
 * orientation flag stripped. Non-JPEG files and upright photos pass through.
 */
export async function normalizeImageOrientation(
  file: File,
  { quality = 0.92 }: { quality?: number } = {},
): Promise<File> {
  const orientation = await readExifOrientation(file);
  if (orientation === 1) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImageOriented(file);
  } catch {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "kreuz";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
}
