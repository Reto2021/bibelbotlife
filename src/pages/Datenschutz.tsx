import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Startseite", "item": "https://biblebot.life/" },
    { "@type": "ListItem", "position": 2, "name": "Datenschutz", "item": "https://biblebot.life/datenschutz" }
  ]
};

const Datenschutz = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(breadcrumbJsonLd);
    script.id = "breadcrumb-jsonld";
    document.head.appendChild(script);
    return () => { document.getElementById("breadcrumb-jsonld")?.remove(); };
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Verantwortliche Stelle</h2>
            <p className="text-muted-foreground">
              [Hier deine Angaben als verantwortliche Stelle einfügen]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Erhobene Daten</h2>
            <p className="text-muted-foreground">
              [Hier beschreiben, welche Daten erhoben werden]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Zweck der Datenverarbeitung</h2>
            <p className="text-muted-foreground">
              [Hier den Zweck der Datenverarbeitung beschreiben]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Weitergabe an Dritte</h2>
            <p className="text-muted-foreground">
              [Hier beschreiben, ob und an wen Daten weitergegeben werden]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Deine Rechte</h2>
            <p className="text-muted-foreground">
              [Hier die Rechte der Nutzer gemäss DSG beschreiben]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Cookies & Tracking</h2>
            <p className="text-muted-foreground">
              [Hier beschreiben, ob Cookies oder Tracking eingesetzt werden]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Änderungen</h2>
            <p className="text-muted-foreground">
              Diese Datenschutzerklärung kann jederzeit angepasst werden. Stand: April 2026.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Datenschutz;
