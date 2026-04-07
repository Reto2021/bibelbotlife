import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

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
