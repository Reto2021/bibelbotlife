import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cross, Heart, Baby, BookHeart, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { FavoriteToolsBar } from "@/components/ToolCards";

const MeinBereichHome = () => {
  const { t } = useTranslation();

  const ceremonies = [
    {
      titleKey: "meinBereich.funeral",
      descKey: "meinBereich.funeralDesc",
      icon: Cross,
      href: "/mein-bereich/abdankung",
      available: true,
    },
    {
      titleKey: "meinBereich.wedding",
      descKey: "meinBereich.weddingDesc",
      icon: Heart,
      href: "/mein-bereich/hochzeit",
      available: false,
    },
    {
      titleKey: "meinBereich.baptismCeremony",
      descKey: "meinBereich.baptismDesc",
      icon: Baby,
      href: "/mein-bereich/taufe",
      available: false,
    },
    {
      titleKey: "meinBereich.confirmation",
      descKey: "meinBereich.confirmationDesc",
      icon: BookHeart,
      href: "/mein-bereich/konfirmation",
      available: false,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <SEOHead titleKey="meinBereich.title" descKey="meinBereich.subtitle" path="/mein-bereich" />
      <div>
        <h1 className="text-xl md:text-2xl font-bold">{t("meinBereich.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("meinBereich.subtitle")}</p>
      </div>

      <FavoriteToolsBar />

      <div className="grid gap-3 sm:grid-cols-2">
        {ceremonies.map((c) => (
          <Card
            key={c.href}
            className={`relative transition-colors ${c.available ? "hover:border-primary cursor-pointer active:scale-[0.98]" : "opacity-60"}`}
          >
            {c.available ? (
              <Link to={c.href} className="absolute inset-0 z-10" />
            ) : (
              <span className="absolute top-3 right-3 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {t("meinBereich.comingSoon")}
              </span>
            )}
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-1">
                    {t(c.titleKey)}
                    {c.available && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5 line-clamp-2">
                    {t(c.descKey)}
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
