import { useCallback, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import bibelbotLogo from "@/assets/biblebot-logo.png";

interface QRStickerDownloadProps {
  churchName: string;
  qrUrl: string;
  slug: string;
}

/**
 * Generates a beautiful branded QR sticker as a downloadable PDF-like PNG.
 * Layout:
 *   "Präsentiert von [Organisationsname]"
 *   [QR Code with BibleBot logo]
 *   "BibleBot.Life — Everyday Sunday"
 */
export function QRStickerDownload({ churchName, qrUrl, slug }: QRStickerDownloadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateSticker = useCallback(async () => {
    const W = 800;
    const H = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#FFFDF7";
    ctx.beginPath();
    roundRect(ctx, 0, 0, W, H, 24);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = "#E8DFD0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, 1, 1, W - 2, H - 2, 24);
    ctx.stroke();

    // Top line — "Präsentiert von"
    ctx.fillStyle = "#8B7355";
    ctx.font = "300 22px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Präsentiert von", W / 2, 100);

    // Church name
    ctx.fillStyle = "#2D2318";
    ctx.font = "600 36px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(churchName, W / 2, 148);

    // Decorative divider
    ctx.strokeStyle = "#C8883A";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, 175);
    ctx.lineTo(W / 2 + 60, 175);
    ctx.stroke();

    // QR Code — render via SVG from react-qr-code approach (manual)
    const qrSize = 380;
    const qrX = (W - qrSize) / 2;
    const qrY = 210;

    // Draw QR using an offscreen image from external API
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&margin=0&ecc=H`;
    });

    // White background for QR
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    roundRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
    ctx.fill();
    ctx.strokeStyle = "#F0EBE3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
    ctx.stroke();

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // BibleBot logo in center of QR
    const logoImg = new Image();
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = reject;
      logoImg.src = bibelbotLogo;
    });
    const logoSize = Math.round(qrSize * 0.22);
    const logoX = qrX + (qrSize - logoSize) / 2;
    const logoY = qrY + (qrSize - logoSize) / 2;

    // White background behind logo
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    roundRect(ctx, logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 8);
    ctx.fill();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

    // Bottom divider
    ctx.strokeStyle = "#C8883A";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, qrY + qrSize + 60);
    ctx.lineTo(W / 2 + 60, qrY + qrSize + 60);
    ctx.stroke();

    // Bottom text — BibleBot.Life
    ctx.fillStyle = "#C8883A";
    ctx.font = "700 32px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BibleBot.Life", W / 2, qrY + qrSize + 105);

    // Tagline
    ctx.fillStyle = "#8B7355";
    ctx.font = "italic 300 20px 'Georgia', serif";
    ctx.fillText("Everyday Sunday", W / 2, qrY + qrSize + 140);

    // Small URL hint at bottom
    ctx.fillStyle = "#B5A896";
    ctx.font = "300 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(qrUrl, W / 2, H - 40);

    // Download
    const link = document.createElement("a");
    link.download = `biblebot-sticker-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [churchName, qrUrl, slug]);

  return (
    <Button size="sm" variant="outline" onClick={generateSticker} className="gap-1.5">
      <Download className="h-3.5 w-3.5" />
      Sticker herunterladen
    </Button>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
