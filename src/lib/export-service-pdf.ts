import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ServiceBlockData } from "@/components/services/ServiceBlock";

const BLOCK_LABELS: Record<string, string> = {
  song: "🎵 Lied",
  reading: "📖 Lesung",
  sermon: "🎤 Predigt",
  prayer: "🙏 Gebet",
  blessing: "✝ Segen",
  communion: "⛪ Abendmahl",
  liturgy: "📜 Liturgie",
  announcement: "📢 Mitteilung",
  music: "🎶 Musik",
  free: "📝 Frei",
};

const TRADITION_LABELS: Record<string, string> = {
  reformed: "Reformiert",
  catholic: "Katholisch",
  lutheran: "Lutherisch",
  evangelical: "Evangelikal",
  secular: "Säkular / Frei",
};

const TYPE_LABELS: Record<string, string> = {
  regular: "Sonntagsgottesdienst",
  baptism: "Taufe",
  wedding: "Trauung",
  funeral: "Abdankung",
  confirmation: "Konfirmation",
  communion: "Abendmahl",
  special: "Spezialgottesdienst",
  other: "Anderes",
};

interface ExportOptions {
  title: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  tradition: string;
  blocks: ServiceBlockData[];
  churchName?: string;
  notes?: string;
}

function buildServiceDoc(options: ExportOptions): jsPDF {
  const { title, serviceDate, serviceTime, serviceType, tradition, blocks, churchName, notes } = options;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const dateFormatted = new Date(serviceDate).toLocaleDateString("de-CH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const meta = [
    `${dateFormatted}, ${serviceTime} Uhr`,
    `${TYPE_LABELS[serviceType] || serviceType} · ${TRADITION_LABELS[tradition] || tradition}`,
  ];
  if (churchName) meta.unshift(churchName);

  meta.forEach((line, i) => {
    doc.text(line, margin, 33 + i * 5);
  });

  // Divider
  const dividerY = 33 + meta.length * 5 + 3;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageWidth - margin, dividerY);

  // Total duration
  const totalDuration = blocks.reduce((sum, b) => sum + (b.duration || 0), 0);

  // Table
  const tableData = blocks.map((block, i) => {
    const label = BLOCK_LABELS[block.type] || block.type;
    const dur = block.duration ? `${block.duration}'` : "";
    const content = block.content ? block.content.substring(0, 120) + (block.content.length > 120 ? "..." : "") : "";
    const details = [block.title, content].filter(Boolean).join("\n");
    return [String(i + 1), label, details, dur];
  });

  autoTable(doc, {
    startY: dividerY + 4,
    head: [["#", "Typ", "Inhalt", "Min."]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [40, 55, 70],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 14, halign: "center" },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${title} — ${dateFormatted}`, margin, pageHeight - 8);
      doc.text(
        `Seite ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  // Duration summary after table
  const finalY = (doc as any).lastAutoTable?.finalY || dividerY + 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  if (totalDuration > 0) {
    doc.text(`Gesamtdauer: ca. ${totalDuration} Minuten`, margin, finalY + 8);
  }

  return doc;
}

export function exportServicePdf(options: ExportOptions) {
  const doc = buildServiceDoc(options);
  const safeTitle = options.title.replace(/[^a-zA-Z0-9äöüÄÖÜ\- ]/g, "").trim().replace(/\s+/g, "_");
  doc.save(`${options.serviceDate}_${safeTitle}.pdf`);
}

export function exportServicePdfBlob(options: ExportOptions): Blob {
  const doc = buildServiceDoc(options);
  return doc.output("blob");
}
