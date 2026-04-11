import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Startseite", "item": "https://biblebot.life/" },
    { "@type": "ListItem", "position": 2, "name": "Impressum", "item": "https://biblebot.life/impressum" }
  ]
};

const Impressum = () => {
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
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Verantwortlich für den Inhalt</h2>
            <p className="text-muted-foreground">
              [Dein Name]<br />
              [Strasse und Hausnummer]<br />
              [PLZ Ort]<br />
              Schweiz
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
            <p className="text-muted-foreground">
              E-Mail: [deine@email.ch]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>
            <p className="text-muted-foreground">
              [Hier deinen Haftungsausschluss einfügen]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Urheberrecht</h2>
            <p className="text-muted-foreground">
              [Hier deine Urheberrechtshinweise einfügen]
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Impressum;
