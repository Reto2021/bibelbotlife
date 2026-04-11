import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import bibelbotLogo from "@/assets/biblebot-logo.png";
import { jsPDF } from "jspdf";

interface QRFlyerDownloadProps {
  churchName: string;
  qrUrl: string;
  slug: string;
}

const MM_TO_PT = 72 / 25.4;

/**
 * Generates a print-ready A4 PDF with 6 branded QR stickers (2 columns × 3 rows).
 * Each sticker: "Präsentiert von [Org]" + QR + "BibleBot.Life — Everyday Sunday"
 */
export function QRFlyerDownload({ churchName, qrUrl, slug }: QRFlyerDownloadProps) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      // Load assets
      const [qrImg, logoImg] = await Promise.all([
        loadImage(`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrUrl)}&margin=0&ecc=H`),
        loadImage(bibelbotLogo),
      ]);

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const cols = 2;
      const rows = 3;
      const marginX = 15;
      const marginY = 15;
      const gapX = 10;
      const gapY = 8;
      const cardW = (pageW - 2 * marginX - (cols - 1) * gapX) / cols;
      const cardH = (pageH - 2 * marginY - (rows - 1) * gapY) / rows;

      // Draw cut guides (light dashed lines)
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = marginX + c * (cardW + gapX);
          const y = marginY + r * (cardH + gapY);
          drawSticker(pdf, x, y, cardW, cardH, churchName, qrImg, logoImg);
        }
      }

      // Small footer
      pdf.setFontSize(7);
      pdf.setTextColor(180, 180, 180);
      pdf.text("✂ Entlang der Linien ausschneiden", pageW / 2, pageH - 5, { align: "center" });

      pdf.save(`biblebot-flyer-${slug}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={generate} disabled={generating} className="gap-1.5">
      {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
      A4 Druckvorlage
    </Button>
  );
}

function drawSticker(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  churchName: string,
  qrImg: HTMLImageElement,
  logoImg: HTMLImageElement
) {
  const cx = x + w / 2;

  // Card background
  pdf.setFillColor(255, 253, 247);
  pdf.setDrawColor(232, 223, 208);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h, 3, 3, "FD");

  // "Präsentiert von"
  pdf.setFontSize(8);
  pdf.setTextColor(139, 115, 85);
  pdf.setFont("helvetica", "normal");
  pdf.text("Präsentiert von", cx, y + 12, { align: "center" });

  // Church name
  pdf.setFontSize(13);
  pdf.setTextColor(45, 35, 24);
  pdf.setFont("helvetica", "bold");
  const nameLines = pdf.splitTextToSize(churchName, w - 10);
  pdf.text(nameLines, cx, y + 19, { align: "center" });
  const nameEndY = y + 19 + (nameLines.length - 1) * 5;

  // Gold divider
  pdf.setDrawColor(200, 136, 58);
  pdf.setLineWidth(0.4);
  pdf.line(cx - 12, nameEndY + 4, cx + 12, nameEndY + 4);

  // QR code
  const qrSize = Math.min(w - 20, h - 70);
  const qrX = cx - qrSize / 2;
  const qrY = nameEndY + 8;

  // White bg for QR
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(240, 235, 227);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 2, 2, "FD");

  // QR image
  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = 600;
  qrCanvas.height = 600;
  const ctx = qrCanvas.getContext("2d")!;
  ctx.drawImage(qrImg, 0, 0, 600, 600);

  // Logo overlay in center
  const logoSize = Math.round(600 * 0.22);
  const logoOffset = (600 - logoSize) / 2;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(logoOffset - 6, logoOffset - 6, logoSize + 12, logoSize + 12);
  ctx.drawImage(logoImg, logoOffset, logoOffset, logoSize, logoSize);

  pdf.addImage(qrCanvas.toDataURL("image/png"), "PNG", qrX, qrY, qrSize, qrSize);

  // Gold divider below QR
  const belowQr = qrY + qrSize + 5;
  pdf.setDrawColor(200, 136, 58);
  pdf.setLineWidth(0.4);
  pdf.line(cx - 12, belowQr, cx + 12, belowQr);

  // BibleBot.Life
  pdf.setFontSize(13);
  pdf.setTextColor(200, 136, 58);
  pdf.setFont("helvetica", "bold");
  pdf.text("BibleBot.Life", cx, belowQr + 7, { align: "center" });

  // Tagline
  pdf.setFontSize(9);
  pdf.setTextColor(139, 115, 85);
  pdf.setFont("helvetica", "italic");
  pdf.text("Everyday Sunday", cx, belowQr + 13, { align: "center" });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
