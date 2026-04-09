import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Church, ArrowLeft, Search, MapPin } from "lucide-react";
import bibelbotLogo from "@/assets/biblebot-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const ChurchDirectory = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: churches = [], isLoading } = useQuery({
    queryKey: ["church-partners"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("church_partners_public" as any)
        .select("id, slug, name, denomination, city, country, logo_url, plan_tier")
        .order("name") as any);
      if (error) throw error;
      return data;
    },
  });

  const filtered = churches.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (c.denomination?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <img src={bibelbotLogo} alt="BibleBot" className="h-8 w-8" />
            {t("impressum.back")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Church className="h-4 w-4" />
              {t("church.directoryBadge")}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">{t("church.directoryTitle")}</h1>
            <p className="text-muted-foreground mb-8">{t("church.directorySubtitle")}</p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("church.searchPlaceholder")}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground animate-pulse py-12">{t("loader")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("church.noResults")}</p>
              <Button asChild variant="link" className="mt-4">
                <Link to="/for-churches">{t("church.becomePartner")}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((church) => (
                <Link key={church.id} to={`/church/${church.slug}`}>
                  <Card className="bg-card/80 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                    <CardHeader className="flex flex-row items-center gap-3">
                      {church.logo_url ? (
                        <img src={church.logo_url} alt={church.name} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Church className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{church.name}</CardTitle>
                        {church.denomination && (
                          <p className="text-xs text-muted-foreground">{church.denomination}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {church.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {church.city}, {church.country}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ChurchDirectory;
