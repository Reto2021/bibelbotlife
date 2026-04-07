import { MessageCircle, BookOpen, Calendar, Heart, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BibelBotChat } from "@/components/BibelBotChat";
const WHATSAPP_LINK = "https://wa.me/41XXXXXXXXXX?text=Hallo%20BibelBot!";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Bibelstellen & Auslegung",
      description: "Frage «Was sagt die Bibel zu...?» und erhalte passende Verse mit Kontext und verständlicher Erklärung."
    },
    {
      icon: Star,
      title: "Tagesimpulse & Gebete",
      description: "Starte oder beende deinen Tag mit inspirierenden Bibelversen und passenden Gebeten."
    },
    {
      icon: Calendar,
      title: "Kirchenjahr-Begleitung",
      description: "Lass dich durch Advent, Fastenzeit und kirchliche Feiertage führen mit passenden Impulsen."
    },
    {
      icon: Heart,
      title: "Persönliche Begleitung",
      description: "Ob Konfirmation, Trauer oder Sinnsuche – der BibelBot begleitet dich in allen Lebensphasen."
    },
    {
      icon: Users,
      title: "Gruppen & Gemeinden",
      description: "Perfekt für Bibelkreise, Gemeinde-Gruppen und gemeinschaftliche Andachten."
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description: "Einfach und vertraut – direkt über WhatsApp, wo du bereits mit Familie und Freunden chattest."
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BibelBot.ch</span>
          </div>
          <Button asChild className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Jetzt starten
            </a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Dein persönlicher
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--gradient-cta)" }}> Bibelbegleiter</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              BibelBot.ch ist dein WhatsApp-Chatbot, der dich mit der Weisheit der Bibel 
              durch alle Lebenssituationen begleitet. Einfach, persönlich und immer verfügbar.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="lg" className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground px-8 py-4 text-lg">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 mr-2" />
                Über WhatsApp starten
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-accent px-8 py-4 text-lg">
              Mehr erfahren
            </Button>
          </div>

          <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border">
            <p className="text-foreground/80 italic text-lg">
              «Dein Wort ist meines Fusses Leuchte und ein Licht auf meinem Wege.»
            </p>
            <p className="text-muted-foreground mt-2">– Psalm 119,105</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Wie BibelBot.ch dich begleitet
            </h2>
            <p className="text-xl text-muted-foreground">
              Entdecke die vielfältigen Möglichkeiten, wie der BibelBot dein spirituelles Leben bereichern kann
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundImage: "var(--gradient-cta)" }}>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Bereit für deine spirituelle Reise?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Starte heute noch und lasse dich von der Bibel durch deinen Alltag begleiten. 
            Kostenlos und jederzeit verfügbar über WhatsApp.
          </p>
          <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90 px-8 py-4 text-lg font-semibold">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5 mr-2" />
              BibelBot jetzt kontaktieren
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BibelBot.ch</span>
          </div>
          <p className="text-background/70 mb-6">
            Dein digitaler Begleiter für ein Leben mit der Bibel
          </p>
          <div className="border-t border-background/20 pt-6">
            <p className="text-background/50 text-sm">
              © 2024 BibelBot.ch – Mit ❤️ für die christliche Gemeinschaft entwickelt
            </p>
          </div>
        </div>
      </footer>

      <BibelBotChat />
    </div>
  );
};

export default Index;
