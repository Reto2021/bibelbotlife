/**
 * Generates a 1080×1080 social sharing tile with Bible verse + BibleBot.Life branding.
 * Uses AI-generated background image from edge function, with canvas text overlay.
 */

const SIZE = 1080;
const PAD = 80;
const CONTENT_W = SIZE - PAD * 2;

// Brand colors
const GOLD = "#C8883A";
const GOLD_LIGHT = "#E8C088";
const PETROL = "#3D7A80";
const BG_CREAM = "#FAF5ED";
const TEXT_DARK = "#2B3E42";

type ChurchBrandingInfo = {
  name: string;
  logoUrl?: string | null;
  slug: string;
};

type ShareTileOptions = {
  verse: string;
  reference: string;
  topic?: string;
  personalNote?: string;
  dark?: boolean;
  /** Pre-fetched background image URL (from AI generation) */
  backgroundUrl?: string;
  /** Church branding for sponsored instances */
  churchBranding?: ChurchBrandingInfo;
};

const SHARE_IMAGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/impulse-share-image`;

/**
 * Fetch an AI-generated background image URL for the given impulse.
 * Returns the public URL or null on failure.
 */
export async function fetchAIBackgroundUrl(impulse: {
  verse: string;
  reference: string;
  topic?: string;
  teaser?: string;
  date: string;
}): Promise<string | null> {
  try {
    const resp = await fetch(SHARE_IMAGE_FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verse: impulse.verse,
        reference: impulse.reference,
        topic: impulse.topic || "Faith",
        teaser: impulse.teaser || "",
        date: impulse.date,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.imageUrl || null;
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateShareImage(options: ShareTileOptions): Promise<Blob> {
  const { verse, reference, topic, personalNote, backgroundUrl, churchBranding } = options;

  return new Promise(async (resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    // --- Try to load background image ---
    let bgImage: HTMLImageElement | null = null;
    if (backgroundUrl) {
      try {
        bgImage = await loadImage(backgroundUrl);
      } catch {
        console.warn("Failed to load AI background, using fallback");
      }
    }

    if (bgImage) {
      // Draw image covering the full canvas (center crop)
      const imgAspect = bgImage.width / bgImage.height;
      let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height;
      if (imgAspect > 1) {
        sw = bgImage.height;
        sx = (bgImage.width - sw) / 2;
      } else {
        sh = bgImage.width;
        sy = (bgImage.height - sh) / 2;
      }
      ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, SIZE, SIZE);

      // Dark overlay for text readability
      const overlay = ctx.createLinearGradient(0, 0, 0, SIZE);
      overlay.addColorStop(0, "rgba(26, 42, 45, 0.40)");
      overlay.addColorStop(0.3, "rgba(26, 42, 45, 0.50)");
      overlay.addColorStop(0.65, "rgba(26, 42, 45, 0.68)");
      overlay.addColorStop(1, "rgba(26, 42, 45, 0.82)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, SIZE, SIZE);
    } else {
      // Fallback: warm cream background with subtle gradient
      ctx.fillStyle = BG_CREAM;
      ctx.fillRect(0, 0, SIZE, SIZE);
      const grad = ctx.createRadialGradient(SIZE * 0.3, SIZE * 0.2, 0, SIZE * 0.5, SIZE * 0.5, SIZE * 0.8);
      grad.addColorStop(0, "rgba(200,136,58,0.08)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    const hasImage = !!bgImage;
    const textColor = hasImage ? "#F5EDE0" : TEXT_DARK;
    const textSubtle = hasImage ? "rgba(245,237,224,0.7)" : "rgba(43,62,66,0.65)";
    const goldAlpha = hasImage ? "rgba(200,136,58,0.35)" : "rgba(200,136,58,0.12)";
    const brandSubtle = hasImage ? "rgba(245,237,224,0.5)" : "rgba(43,62,66,0.4)";
    const lineColor = hasImage ? "rgba(200,136,58,0.4)" : "rgba(200,136,58,0.12)";

    // Helper: apply text shadow on image backgrounds
    const withShadow = (fn: () => void) => {
      if (hasImage) {
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
      }
      fn();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    };

    // --- Decorative top accent line ---
    ctx.fillStyle = GOLD;
    ctx.fillRect(PAD, 70, 60, 4);

    // --- Topic label ---
    let y = 110;
    if (topic) {
      ctx.font = "600 28px 'Inter', 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = GOLD_LIGHT;
      ctx.textBaseline = "top";
      withShadow(() => ctx.fillText(topic.toUpperCase(), PAD, y));
      y += 50;
    }

    // --- Quote mark ---
    ctx.font = "bold 120px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = goldAlpha;
    ctx.textBaseline = "top";
    ctx.fillText("«", PAD - 12, y - 20);

    // --- Verse text ---
    const verseFontSize = verse.length > 200 ? 34 : verse.length > 120 ? 38 : 44;
    const verseLineHeight = verseFontSize * 1.55;
    ctx.font = `italic ${verseFontSize}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = "top";

    const verseLines = wrapText(ctx, verse, CONTENT_W);
    withShadow(() => {
      for (const line of verseLines) {
        ctx.fillText(line, PAD, y);
        y += verseLineHeight;
      }
    });

    y += 20;

    // --- Reference ---
    ctx.font = "500 26px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = hasImage ? GOLD_LIGHT : PETROL;
    withShadow(() => ctx.fillText(`— ${reference}`, PAD, y));
    y += 50;

    // --- Personal note ---
    if (personalNote) {
      y += 10;
      ctx.fillStyle = goldAlpha;
      ctx.fillRect(PAD, y, 40, 2);
      y += 24;

      ctx.font = `400 28px 'Inter', 'Segoe UI', system-ui, sans-serif`;
      ctx.fillStyle = textSubtle;
      const noteLines = wrapText(ctx, personalNote, CONTENT_W);
      for (const line of noteLines) {
        ctx.fillText(line, PAD, y);
        y += 38;
      }
    }

    // --- Bottom branding bar ---
    const brandY = churchBranding ? SIZE - 110 : SIZE - 90;

    ctx.fillStyle = lineColor;
    ctx.fillRect(PAD, brandY - 20, CONTENT_W, 1);

    ctx.font = "700 30px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = GOLD;
    ctx.textBaseline = "top";
    withShadow(() => ctx.fillText("BibleBot.Life", PAD, brandY));

    ctx.font = "400 22px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = brandSubtle;
    ctx.fillText("Everyday Sunday", PAD, brandY + 38);

    // --- Church branding (sponsor) ---
    if (churchBranding) {
      const sponsorY = brandY + 70;
      ctx.font = "400 20px 'Inter', 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = brandSubtle;
      const sponsorText = `Empfohlen von ${churchBranding.name}`;
      withShadow(() => ctx.fillText(sponsorText, PAD, sponsorY));

      // Load and draw church logo if available
      if (churchBranding.logoUrl) {
        try {
          const churchLogo = await loadImage(churchBranding.logoUrl);
          const logoSize = 36;
          const textWidth = ctx.measureText(sponsorText).width;
          const logoX = PAD + textWidth + 12;
          ctx.drawImage(churchLogo, logoX, sponsorY - 6, logoSize, logoSize);
        } catch {
          // Logo load failed, text alone is fine
        }
      }
    }

    // Small decorative dot
    ctx.beginPath();
    ctx.arc(SIZE - PAD, brandY + 20, 6, 0, Math.PI * 2);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fill();

    // --- Export ---
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Generate and trigger download of a share tile.
 */
export async function downloadShareTile(options: ShareTileOptions, filename: string): Promise<void> {
  const blob = await generateShareImage(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and share via Web Share API (with image file).
 */
export async function shareAsTile(options: ShareTileOptions, shareText: string): Promise<boolean> {
  const blob = await generateShareImage(options);
  const file = new File([blob], "biblebot-verse.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "BibleBot.Life",
        text: shareText,
        files: [file],
      });
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return true;
    }
  }
  return false;
}
