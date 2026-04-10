import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSharedDraft } from "@/hooks/use-ceremony-drafts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Cross, Heart, Baby, BookHeart } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import jsPDF from "jspdf";

const typeIcons = {
  funeral: Cross,
  wedding: Heart,
  baptism: Baby,
  confirmation: BookHeart,
};

const typeLabels: Record<string, string> = {
  funeral: "Abdankung – Lebenslauf",
  wedding: "Hochzeit",
  baptism: "Taufe",
  confirmation: "Konfirmation",
};

export default function SharedDraft() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const { data: draft, isLoading, error } = useSharedDraft(token);

  const downloadPDF = () => {
    if (!draft?.generated_text) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25;
    const maxWidth = pageWidth - margin * 2;

    if (draft.person_name) {
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(doc.splitTextToSize(draft.person_name, maxWidth), pageWidth / 2, 35, { align: "center" });
    }

    // form_data no longer returned by hardened RPC

    const lineY = 52;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, lineY, pageWidth - margin - 20, lineY);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(draft.generated_text, maxWidth);
    const lineHeight = 6;
    let currentY = lineY + 12;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (const line of lines) {
      if (currentY + lineHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 25;
      }
      doc.text(line, margin, currentY);
      currentY += lineHeight;
    }

    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text("Erstellt mit BibleBot.Life", pageWidth / 2, pageHeight - 10, { align: "center" });

    const fileName = draft.person_name
      ? `Lebenslauf_${draft.person_name.replace(/\s+/g, "_")}.pdf`
      : "Lebenslauf.pdf";
    doc.save(fileName);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Dieser Link ist ungültig oder der Entwurf wurde nicht freigegeben.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = typeIcons[draft.ceremony_type] || Cross;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        titleKey="eulogy.pageTitle"
        descKey="eulogy.pageDesc"
        path={`/shared/${token}`}
      />

      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{typeLabels[draft.ceremony_type]}</h1>
            <p className="text-sm text-muted-foreground">
              Geteilt über BibleBot.Life
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {draft.person_name && (
          <Card>
            <CardHeader>
              <CardTitle>{draft.person_name}</CardTitle>
            </CardHeader>
          </Card>
        )}

        {draft.generated_text && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lebenslauf-Text</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {draft.generated_text}
              </div>
              <div className="mt-6">
                <Button onClick={downloadPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Als PDF herunterladen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* transcripts no longer exposed via shared RPC */}
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Erstellt mit <a href="https://bibelbotlife.lovable.app" className="underline">BibleBot.Life</a>
      </footer>
    </div>
  );
}
