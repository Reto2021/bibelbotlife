import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  PageNumber,
  Footer,
  Header,
} from "docx";
import { saveAs } from "file-saver";
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

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 60, bottom: 60, left: 80, right: 80 };

function buildDocx(options: ExportOptions): Document {
  const { title, serviceDate, serviceTime, serviceType, tradition, blocks, churchName } = options;

  const dateFormatted = new Date(serviceDate).toLocaleDateString("de-CH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const metaLine = `${dateFormatted}, ${serviceTime} Uhr · ${TYPE_LABELS[serviceType] || serviceType} · ${TRADITION_LABELS[tradition] || tradition}`;
  const totalDuration = blocks.reduce((sum, b) => sum + (b.duration || 0), 0);

  // Header row
  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders: cellBorders,
        width: { size: 600, type: WidthType.DXA },
        shading: { fill: "283746", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        width: { size: 1800, type: WidthType.DXA },
        shading: { fill: "283746", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: "Typ", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        width: { size: 5760, type: WidthType.DXA },
        shading: { fill: "283746", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: "Inhalt", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })],
      }),
      new TableCell({
        borders: cellBorders,
        width: { size: 866, type: WidthType.DXA },
        shading: { fill: "283746", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Min.", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })],
      }),
    ],
  });

  // Data rows
  const dataRows = blocks.map((block, i) => {
    const label = BLOCK_LABELS[block.type] || block.type;
    const dur = block.duration ? `${block.duration}'` : "";
    const contentParts: Paragraph[] = [];
    if (block.title) {
      contentParts.push(new Paragraph({ children: [new TextRun({ text: block.title, bold: true, size: 18, font: "Arial" })] }));
    }
    if (block.content) {
      const truncated = block.content.length > 200 ? block.content.substring(0, 200) + "..." : block.content;
      contentParts.push(new Paragraph({ children: [new TextRun({ text: truncated, size: 18, font: "Arial", color: "555555" })] }));
    }
    if (contentParts.length === 0) {
      contentParts.push(new Paragraph({ children: [] }));
    }

    const isEven = i % 2 === 0;
    const rowFill = isEven ? "F8F8F8" : "FFFFFF";
    const rowShading = { fill: rowFill, type: ShadingType.CLEAR };

    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: 600, type: WidthType.DXA },
          shading: rowShading,
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), size: 18, font: "Arial" })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: 1800, type: WidthType.DXA },
          shading: rowShading,
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, font: "Arial" })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: 5760, type: WidthType.DXA },
          shading: rowShading,
          margins: cellMargins,
          children: contentParts,
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: 866, type: WidthType.DXA },
          shading: rowShading,
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dur, size: 18, font: "Arial" })] })],
        }),
      ],
    });
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: churchName || "BibleBot.Life", size: 16, color: "999999", font: "Arial" })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${title} — ${dateFormatted}  |  Seite `, size: 16, color: "999999", font: "Arial" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999", font: "Arial" }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: title, bold: true, size: 36, font: "Arial" })],
          }),
          // Meta
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: churchName ? `${churchName}` : "", size: 20, color: "666666", font: "Arial" })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: metaLine, size: 20, color: "666666", font: "Arial" })],
          }),
          // Table
          new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [600, 1800, 5760, 866],
            rows: [headerRow, ...dataRows],
          }),
          // Duration summary
          ...(totalDuration > 0
            ? [
                new Paragraph({
                  spacing: { before: 200 },
                  children: [new TextRun({ text: `Gesamtdauer: ca. ${totalDuration} Minuten`, bold: true, size: 20, font: "Arial", color: "333333" })],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return doc;
}

export async function exportServiceDocx(options: ExportOptions) {
  const doc = buildDocx(options);
  const blob = await Packer.toBlob(doc);
  const safeTitle = options.title.replace(/[^a-zA-Z0-9äöüÄÖÜ\- ]/g, "").trim().replace(/\s+/g, "_");
  saveAs(blob, `${options.serviceDate}_${safeTitle}.docx`);
}
