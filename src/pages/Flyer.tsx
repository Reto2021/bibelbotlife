import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export default function Flyer() {
  return (
    <>
      <SEOHead
        title="Flyer & QR-Material | BibleBot.Life"
        description="Druckbarer Flyer für Kirchgemeinden — BibleBot.Life QR-Code und Kurzvorstellung zum Auslegen und Verteilen."
        path="/flyer"
      />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <div className="container mx-auto max-w-2xl px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Flyer & QR-Material</h1>
            <p className="text-muted-foreground">Zum Ausdrucken und Verteilen in deiner Gemeinde.</p>
            <div className="flex gap-3 justify-center mt-5">
              <Button onClick={() => window.print()} size="lg">
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Als PDF speichern
              </Button>
            </div>
          </div>

          {/* Printable flyer — A6 proportions */}
          <div
            id="flyer-print"
            className="mx-auto bg-white rounded-2xl border-2 border-border overflow-hidden shadow-lg print:shadow-none print:rounded-none print:border-0"
            style={{ maxWidth: 420 }}
          >
            {/* Header stripe */}
            <div className="bg-[hsl(32,65%,52%)] px-8 pt-8 pb-6 text-white text-center">
              <div className="text-3xl font-bold tracking-tight mb-1">BibleBot.Life</div>
              <p className="text-white/80 text-sm font-medium">2000 Jahre Weisheit. 24/7 erreichbar. Kein Urteil.</p>
            </div>

            <div className="px-8 py-7 text-center bg-white">
              {/* QR Code — links to biblebot.life */}
              <div className="flex justify-center mb-5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://biblebot.life&bgcolor=ffffff&color=1a1a1a&margin=2`}
                  alt="QR-Code biblebot.life"
                  width={150}
                  height={150}
                  className="rounded-lg"
                />
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-1">biblebot.life</p>
              <p className="text-xs text-gray-500 mb-6">QR-Code scannen oder URL eingeben</p>

              <div className="space-y-2 text-left text-sm text-gray-700 border-t border-gray-100 pt-5">
                {[
                  "✓ Kostenlos & anonym — kein Login nötig",
                  "✓ 35+ Bibelübersetzungen, automatisch geprüft",
                  "✓ 38 Sprachen — für alle Menschen",
                  "✓ Krisenintervention rund um die Uhr",
                  "✓ Ergänzt Gemeinde & Seelsorge",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-[11px] text-gray-400 italic">
                "Der einzige Begleiter, der die Bibel kennt, fragt statt antwortet und niemals urteilt."
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-3 text-center border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                Ein Angebot von BibleBot.Life — Schweiz · reto@bibelbot.ch
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Tipp: Im Browser-Druckdialog "Als PDF speichern" wählen für ein druckfertiges A5/A6-PDF.
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #flyer-print {
            display: block !important;
            position: fixed;
            top: 0; left: 0;
            width: 100vw;
            max-width: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}
