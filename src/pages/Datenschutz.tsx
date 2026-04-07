import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Datenschutz = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

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
