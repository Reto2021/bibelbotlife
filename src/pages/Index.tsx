import { MessageCircle, BookOpen, Calendar, Heart, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Bibelstellen & Auslegung",
      description: "Frage \"Was sagt die Bibel zu...?\" und erhalte passende Verse mit Kontext und verständlicher Erklärung."
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
      description: "Ob Konfirmation, Trauer oder Sinnsuche - der BibelBot begleitet dich in allen Lebensphasen."
    },
    {
      icon: Users,
      title: "Gruppen & Gemeinden",
      description: "Perfekt für Bibelkreise, Gemeinde-WhatsApp-Gruppen und gemeinschaftliche Andachten."
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description: "Einfach und vertraut - direkt über WhatsApp, wo du bereits mit Familie und Freunden chattest."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-amber-600" />
            <span className="text-2xl font-bold text-gray-800">BibelBot.ch</span>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4 mr-2" />
            Jetzt starten
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              Dein persönlicher
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-blue-600"> Bibelbegleiter</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              BibelBot.ch ist dein WhatsApp-Chatbot, der dich mit der Weisheit der Bibel 
              durch alle Lebenssituationen begleitet. Einfach, persönlich und immer verfügbar.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Über WhatsApp starten
            </Button>
            <Button size="lg" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 px-8 py-4 text-lg">
              Mehr erfahren
            </Button>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-amber-100">
            <p className="text-gray-700 italic text-lg">
              "Dein Wort ist meines Fußes Leuchte und ein Licht auf meinem Wege."
            </p>
            <p className="text-gray-500 mt-2">- Psalm 119,105</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Wie BibelBot.ch dich begleitet
            </h2>
            <p className="text-xl text-gray-600">
              Entdecke die vielfältigen Möglichkeiten, wie der BibelBot dein spirituelles Leben bereichern kann
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-amber-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                  <CardTitle className="text-xl text-gray-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-600 to-blue-600">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für deine spirituelle Reise?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Starte heute noch und lasse dich von der Bibel durch deinen Alltag begleiten. 
            Kostenlos und jederzeit verfügbar über WhatsApp.
          </p>
          <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
            <MessageCircle className="h-5 w-5 mr-2" />
            BibelBot jetzt kontaktieren
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-amber-400" />
            <span className="text-2xl font-bold">BibelBot.ch</span>
          </div>
          <p className="text-gray-300 mb-6">
            Dein digitaler Begleiter für ein Leben mit der Bibel
          </p>
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm">
              © 2024 BibelBot.ch - Mit ❤️ für die christliche Gemeinschaft entwickelt
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
