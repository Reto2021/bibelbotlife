/**
 * Generates a 1080×1080 social sharing tile with Bible verse + BibleBot.Life branding.
 * Pure Canvas API — no server call needed.
 */

const SIZE = 1080;
const PAD = 80;
const CONTENT_W = SIZE - PAD * 2;

// Brand colors (from design system)
const GOLD = "#C8883A";
const GOLD_LIGHT = "#E8C088";
const PETROL = "#3D7A80";
const BG_CREAM = "#FAF5ED";
const BG_DARK = "#1A2A2D";
const TEXT_DARK = "#2B3E42";
const TEXT_LIGHT = "#F5EDE0";

type ShareTileOptions = {
  verse: string;
  reference: string;
  topic?: string;
  personalNote?: string;
  dark?: boolean;
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
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
  const { verse, reference, topic, personalNote, dark = false } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    // --- Background ---
    const bg = dark ? BG_DARK : BG_CREAM;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Subtle gradient overlay
    const grad = ctx.createRadialGradient(SIZE * 0.3, SIZE * 0.2, 0, SIZE * 0.5, SIZE * 0.5, SIZE * 0.8);
    grad.addColorStop(0, dark ? "rgba(61,122,128,0.12)" : "rgba(200,136,58,0.08)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // --- Decorative top accent line ---
    ctx.fillStyle = GOLD;
    ctx.fillRect(PAD, 70, 60, 4);

    // --- Topic label ---
    let y = 110;
    if (topic) {
      ctx.font = "600 28px 'Inter', 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = GOLD;
      ctx.textBaseline = "top";
      ctx.fillText(topic.toUpperCase(), PAD, y);
      y += 50;
    }

    // --- Quote mark ---
    ctx.font = "bold 120px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = dark ? "rgba(200,136,58,0.15)" : "rgba(200,136,58,0.12)";
    ctx.textBaseline = "top";
    ctx.fillText("«", PAD - 12, y - 20);

    // --- Verse text ---
    const verseFontSize = verse.length > 200 ? 34 : verse.length > 120 ? 38 : 44;
    const verseLineHeight = verseFontSize * 1.55;
    ctx.font = `italic ${verseFontSize}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = dark ? TEXT_LIGHT : TEXT_DARK;
    ctx.textBaseline = "top";

    const verseLines = wrapText(ctx, verse, CONTENT_W, verseLineHeight);
    for (const line of verseLines) {
      ctx.fillText(line, PAD, y);
      y += verseLineHeight;
    }

    y += 20;

    // --- Reference ---
    ctx.font = "500 26px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = PETROL;
    ctx.fillText(`— ${reference}`, PAD, y);
    y += 50;

    // --- Personal note ---
    if (personalNote) {
      y += 10;
      // Divider
      ctx.fillStyle = dark ? "rgba(200,136,58,0.2)" : "rgba(200,136,58,0.15)";
      ctx.fillRect(PAD, y, 40, 2);
      y += 24;

      ctx.font = `400 28px 'Inter', 'Segoe UI', system-ui, sans-serif`;
      ctx.fillStyle = dark ? "rgba(245,237,224,0.7)" : "rgba(43,62,66,0.65)";
      const noteLines = wrapText(ctx, personalNote, CONTENT_W, 38);
      for (const line of noteLines) {
        ctx.fillText(line, PAD, y);
        y += 38;
      }
    }

    // --- Bottom branding bar ---
    const brandY = SIZE - 90;

    // Subtle line above branding
    ctx.fillStyle = dark ? "rgba(200,136,58,0.2)" : "rgba(200,136,58,0.12)";
    ctx.fillRect(PAD, brandY - 20, CONTENT_W, 1);

    // BibleBot.Life text
    ctx.font = "700 30px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = GOLD;
    ctx.textBaseline = "top";
    ctx.fillText("BibleBot.Life", PAD, brandY);

    // Subline
    ctx.font = "400 22px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = dark ? "rgba(245,237,224,0.4)" : "rgba(43,62,66,0.4)";
    ctx.fillText("Everyday Sunday", PAD, brandY + 38);

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
