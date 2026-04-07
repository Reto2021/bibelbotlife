import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Church, ArrowLeft, MapPin, Globe, Clock, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ChurchContact } from "@/components/ChurchContact";

const TELEGRAM_LINK = "https://t.me/meinbibelbot";

const ChurchPartner = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  const { data: church, isLoading, error } = useQuery({
    queryKey: ["church-partner", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_partners")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const showPastorProfile = church?.plan_tier === "gemeinde" || church?.plan_tier === "kirche";
  const showContact = church?.plan_tier !== "free";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t("loader")}</div>
      </div>
    );
  }

  if (error || !church) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Church className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">{t("church.notFound")}</p>
        <Button asChild variant="outline">
          <Link to="/churches">{t("church.viewDirectory")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/churches" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("church.backToDirectory")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Church Header */}
          <div className="text-center mb-10">
            {church.logo_url ? (
              <img src={church.logo_url} alt={church.name} className="h-20 w-20 rounded-2xl object-cover mx-auto mb-4" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Church className="h-10 w-10 text-primary" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-foreground mb-2">{church.name}</h1>
            {church.denomination && <p className="text-muted-foreground">{church.denomination}</p>}
            {church.city && (
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {church.city}, {church.country}
              </div>
            )}
          </div>

          {/* Welcome Message */}
          {church.welcome_message && (
            <Card className="bg-card/80 border-border mb-6">
              <CardContent className="pt-6">
                <p className="text-foreground/80 italic leading-relaxed">{church.welcome_message}</p>
              </CardContent>
            </Card>
          )}

          {/* Pastor Profile */}
          {showPastorProfile && church.pastor_name && (
            <Card className="bg-card/80 border-border mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{t("church.pastor")}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                {church.pastor_photo_url ? (
                  <img src={church.pastor_photo_url} alt={church.pastor_name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                <p className="font-medium text-foreground">{church.pastor_name}</p>
              </CardContent>
            </Card>
          )}

          {/* Service Times */}
          {church.service_times && (
            <Card className="bg-card/80 border-border mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t("church.serviceTimes")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{church.service_times}</p>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button asChild className="bg-telegram hover:bg-telegram/90 text-telegram-foreground">
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4 mr-2" />
                {t("church.startChat")}
              </a>
            </Button>
            {church.website && (
              <Button asChild variant="outline">
                <a href={church.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  {t("church.website")}
                </a>
              </Button>
            )}
            {church.telegram_group_link && (
              <Button asChild variant="outline">
                <a href={church.telegram_group_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("church.telegramGroup")}
                </a>
              </Button>
            )}
          </div>

          {/* Contact Form */}
          {showContact && <ChurchContact churchId={church.id} churchName={church.name} />}
        </div>
      </section>
    </div>
  );
};

export default ChurchPartner;
