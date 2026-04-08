import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cross, Heart, Baby, BookHeart, ArrowRight } from "lucide-react";

const ceremonies = [
  {
    title: "Abdankung",
    description: "Lebenslauf erstellen, Erinnerungen festhalten und mit dem Seelsorger teilen.",
    icon: Cross,
    href: "/mein-bereich/abdankung",
    available: false,
  },
  {
    title: "Hochzeit",
    description: "Eheversprechen schreiben, Lieder auswählen und die Feier planen.",
    icon: Heart,
    href: "/mein-bereich/hochzeit",
    available: false,
  },
  {
    title: "Taufe",
    description: "Taufwünsche formulieren und den Ablauf mit der Gemeinde vorbereiten.",
    icon: Baby,
    href: "/mein-bereich/taufe",
    available: false,
  },
  {
    title: "Konfirmation",
    description: "Konfirmationsspruch finden und persönliche Texte vorbereiten.",
    icon: BookHeart,
    href: "/mein-bereich/konfirmation",
    available: false,
  },
];

const MeinBereichHome = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mein Bereich</h1>
        <p className="text-muted-foreground mt-1">
          Bereite deine persönlichen Zeremonien vor und teile sie mit deinem Seelsorger.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ceremonies.map((c) => (
          <Card
            key={c.title}
            className={`relative transition-colors ${c.available ? "hover:border-primary cursor-pointer" : "opacity-60"}`}
          >
            {c.available ? (
              <Link to={c.href} className="absolute inset-0 z-10" />
            ) : (
              <span className="absolute top-3 right-3 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                Bald verfügbar
              </span>
            )}
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-1">
                    {c.title}
                    {c.available && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    {c.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MeinBereichHome;
