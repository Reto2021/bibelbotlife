/**
 * Generates a 1080×1080 social sharing tile with Bible verse + BibleBot.Life branding.
 * Features a beautiful background image from Unsplash matched to the verse topic.
 * Pure Canvas API — no server call needed (image from Unsplash Source).
 */

const SIZE = 1080;
const PAD = 80;
const CONTENT_W = SIZE - PAD * 2;

// Brand colors
const GOLD = "#C8883A";
const GOLD_LIGHT = "#E8C088";
const PETROL = "#3D7A80";

type ShareTileOptions = {
  verse: string;
  reference: string;
  topic?: string;
  personalNote?: string;
  dark?: boolean;
};

// Map German topics to evocative English search terms for beautiful photos
const TOPIC_IMAGE_MAP: Record<string, string> = {
  hoffnung: "golden sunrise mountains hope light",
  liebe: "warm sunset couple silhouette love",
  glaube: "cathedral light rays faith spiritual",
  vergebung: "calm lake reflection peaceful forgiveness",
  frieden: "peaceful meadow morning mist calm",
  freude: "joyful sunlight flowers meadow bright",
  trost: "gentle rain window comfort cozy",
  mut: "mountain peak summit courage brave",
  dankbarkeit: "harvest golden wheat field gratitude",
  geduld: "still water zen stones patience calm",
  demut: "quiet forest path humble nature",
  weisheit: "ancient library books wisdom light",
  treue: "oak tree roots strong faithful",
  güte: "kind hands gentle warmth care",
  barmherzigkeit: "open arms embrace mercy compassion",
  stärke: "rocky cliff ocean waves strength",
  gemeinschaft: "warm gathering candlelight community",
  gebet: "hands prayer light spiritual serene",
  zweifel: "fog clearing morning light doubt hope",
  angst: "storm passing rainbow courage calm",
  trauer: "gentle rain autumn leaves memorial",
  heilung: "spring blossom new growth healing",
  vertrauen: "child hand trust safety warmth",
  wahrheit: "clear sky horizon truth clarity",
  licht: "golden hour sunbeam forest light",
  segen: "abundant harvest blessing golden field",
  schöpfung: "majestic nature landscape creation beauty",
  ewigkeit: "starry night sky eternity universe",
  erlösung: "dawn breaking darkness redemption light",
  freiheit: "birds flying open sky freedom",
};

function getImageQuery(topic?: string): string {
  if (!topic) return "peaceful nature golden light spiritual";
  const key = topic.toLowerCase().replace(/[^a-zäöüß]/g, "");
  return TOPIC_IMAGE_MAP[key] || `${topic} nature peaceful spiritual golden`;
}

// Curated Unsplash photo IDs for reliability (beautiful, emotional, landscape/nature)
const FALLBACK_PHOTO_IDS = [
  "WLUHO9A_xik", // golden sunset
  "ln5drpv_ImI", // morning mist mountains
  "1Z2niiBPg5A", // golden wheat field
  "qMehmIyaXvY", // peaceful lake
  "pZXg_ObLOM4", // warm forest light
  "iqeG5xA96M4", // sunrise meadow
];

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
  const { verse, reference, topic, personalNote } = options;

  return new Promise(async (resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    // --- Try to load a background image ---
    let bgImage: HTMLImageElement | null = null;
    try {
      const query = getImageQuery(topic);
      // Use Unsplash source for a topic-matched image
      const imgUrl = `https://source.unsplash.com/1080x1080/?${encodeURIComponent(query)}`;
      bgImage = await loadImage(imgUrl);
    } catch {
      // Try a fallback curated photo
      try {
        const fallbackId = FALLBACK_PHOTO_IDS[Math.floor(Math.random() * FALLBACK_PHOTO_IDS.length)];
        bgImage = await loadImage(`https://images.unsplash.com/photo-${fallbackId}?w=1080&h=1080&fit=crop&auto=format`);
      } catch {
        // No image — continue with solid background
      }
    }

    if (bgImage) {
      // Draw image covering the full canvas
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

      // Dark overlay for text readability — gradient from bottom
      const overlay = ctx.createLinearGradient(0, 0, 0, SIZE);
      overlay.addColorStop(0, "rgba(26, 42, 45, 0.45)");
      overlay.addColorStop(0.35, "rgba(26, 42, 45, 0.55)");
      overlay.addColorStop(0.7, "rgba(26, 42, 45, 0.72)");
      overlay.addColorStop(1, "rgba(26, 42, 45, 0.85)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, SIZE, SIZE);
    } else {
      // Fallback: warm cream background
      ctx.fillStyle = "#FAF5ED";
      ctx.fillRect(0, 0, SIZE, SIZE);
      const grad = ctx.createRadialGradient(SIZE * 0.3, SIZE * 0.2, 0, SIZE * 0.5, SIZE * 0.5, SIZE * 0.8);
      grad.addColorStop(0, "rgba(200,136,58,0.08)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    const hasImage = !!bgImage;
    const textColor = hasImage ? "#F5EDE0" : "#2B3E42";
    const textSubtle = hasImage ? "rgba(245,237,224,0.7)" : "rgba(43,62,66,0.65)";
    const goldAlpha = hasImage ? "rgba(200,136,58,0.35)" : "rgba(200,136,58,0.12)";
    const brandSubtle = hasImage ? "rgba(245,237,224,0.5)" : "rgba(43,62,66,0.4)";
    const lineColor = hasImage ? "rgba(200,136,58,0.4)" : "rgba(200,136,58,0.12)";

    // --- Decorative top accent line ---
    ctx.fillStyle = GOLD;
    ctx.fillRect(PAD, 70, 60, 4);

    // --- Topic label ---
    let y = 110;
    if (topic) {
      ctx.font = "600 28px 'Inter', 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = GOLD_LIGHT;
      ctx.textBaseline = "top";
      ctx.fillText(topic.toUpperCase(), PAD, y);
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

    // Add text shadow for image backgrounds
    if (hasImage) {
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
    }

    const verseLines = wrapText(ctx, verse, CONTENT_W, verseLineHeight);
    for (const line of verseLines) {
      ctx.fillText(line, PAD, y);
      y += verseLineHeight;
    }

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    y += 20;

    // --- Reference ---
    ctx.font = "500 26px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = hasImage ? GOLD_LIGHT : PETROL;
    if (hasImage) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
    }
    ctx.fillText(`— ${reference}`, PAD, y);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    y += 50;

    // --- Personal note ---
    if (personalNote) {
      y += 10;
      ctx.fillStyle = goldAlpha;
      ctx.fillRect(PAD, y, 40, 2);
      y += 24;

      ctx.font = `400 28px 'Inter', 'Segoe UI', system-ui, sans-serif`;
      ctx.fillStyle = textSubtle;
      const noteLines = wrapText(ctx, personalNote, CONTENT_W, 38);
      for (const line of noteLines) {
        ctx.fillText(line, PAD, y);
        y += 38;
      }
    }

    // --- Bottom branding bar ---
    const brandY = SIZE - 90;

    ctx.fillStyle = lineColor;
    ctx.fillRect(PAD, brandY - 20, CONTENT_W, 1);

    ctx.font = "700 30px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = GOLD;
    ctx.textBaseline = "top";
    if (hasImage) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
    }
    ctx.fillText("BibleBot.Life", PAD, brandY);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    ctx.font = "400 22px 'Inter', 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = brandSubtle;
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
