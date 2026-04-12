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
              Reto Wettstein<br />
              Rebmoosweg 63<br />
              5200 Brugg<br />
              Schweiz
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
            <p className="text-muted-foreground">
              E-Mail: <a href="mailto:kontakt@biblebot.life" className="text-primary hover:underline">kontakt@biblebot.life</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>
            <p className="text-muted-foreground">
              Der Autor übernimmt keine Gewähr für die Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen auf dieser Website. Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, die aus dem Zugriff oder der Nutzung bzw. Nichtzutzung der veröffentlichten Informationen, durch Missbrauch der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.
            </p>
            <p className="text-muted-foreground mt-2">
              Alle Angebote sind freibleibend. Der Autor behält es sich ausdrücklich vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Haftung für Links</h2>
            <p className="text-muted-foreground">
              Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. Es wird jegliche Verantwortung für solche Webseiten abgelehnt. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene Gefahr der jeweiligen Nutzerin oder des jeweiligen Nutzers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Urheberrecht</h2>
            <p className="text-muted-foreground">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf dieser Website gehören ausschliesslich Reto Wettstein oder den speziell genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung des Urheberrechtsträgers im Voraus einzuholen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">KI-generierte Inhalte</h2>
            <p className="text-muted-foreground">
              BibleBot.Life nutzt künstliche Intelligenz zur Beantwortung von Fragen und zur Erstellung von Impulsen. Diese Inhalte dienen der persönlichen Inspiration und ersetzen keine professionelle seelsorgerische, theologische oder medizinische Beratung. Die Bibelzitate werden aus anerkannten deutschen Übersetzungen bezogen, die KI-generierten Begleittexte erheben keinen Anspruch auf theologische Verbindlichkeit.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Impressum;
