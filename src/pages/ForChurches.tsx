import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Church, CheckCircle2, ArrowLeft, Send, Users, BarChart3, Palette, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const tiers = [
  {
    key: "free",
    setup: 0,
    annual: 0,
    icon: Church,
    features: ["church.features.directoryEntry", "church.features.telegramGroup"],
    popular: false,
  },
  {
    key: "community",
    setup: 490,
    annual: 790,
    icon: Users,
    features: [
      "church.features.directoryEntry",
      "church.features.telegramGroup",
      "church.features.partnerPage",
      "church.features.badge",
      "church.features.qrFlyer",
      "church.features.contactForm",
    ],
    popular: false,
  },
  {
    key: "gemeinde",
    setup: 990,
    annual: 1490,
    icon: BarChart3,
    features: [
      "church.features.directoryEntry",
      "church.features.telegramGroup",
      "church.features.partnerPage",
      "church.features.badge",
      "church.features.qrFlyer",
      "church.features.contactForm",
      "church.features.pastorProfile",
      "church.features.welcomeVideo",
      "church.features.analytics",
      "church.features.prioritySupport",
    ],
    popular: true,
  },
  {
    key: "kirche",
    setup: 1990,
    annual: 2990,
    icon: Palette,
    features: [
      "church.features.directoryEntry",
      "church.features.telegramGroup",
      "church.features.partnerPage",
      "church.features.badge",
      "church.features.qrFlyer",
      "church.features.contactForm",
      "church.features.pastorProfile",
      "church.features.welcomeVideo",
      "church.features.analytics",
      "church.features.prioritySupport",
      "church.features.multipleProfiles",
      "church.features.customBranding",
      "church.features.apiAccess",
      "church.features.accountManager",
    ],
    popular: false,
  },
];

const ForChurches = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("impressum.back")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
            <Church className="h-4 w-4" />
            {t("church.badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t("church.heroTitle")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{t("church.heroSubtitle")}</p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 px-4 bg-card/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">{t("church.useCasesTitle")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(["youth", "confirmation", "pastoral", "bibleStudy"] as const).map((uc) => (
              <Card key={uc} className="bg-card/80 border-border text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{t(`church.useCase.${uc}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t(`church.useCase.${uc}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">{t("church.pricingTitle")}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">{t("church.pricingSubtitle")}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.key}
                className={`relative bg-card/80 border-border ${tier.popular ? "ring-2 ring-primary shadow-xl" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    {t("church.popular")}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <tier.icon className="h-10 w-10 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">{t(`church.tier.${tier.key}.name`)}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t(`church.tier.${tier.key}.size`)}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    {tier.setup > 0 && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("church.setup")}: <span className="font-semibold text-foreground">CHF {tier.setup.toLocaleString("de-CH")}</span>
                      </p>
                    )}
                    <p className="text-3xl font-bold text-foreground">
                      {tier.annual === 0 ? t("church.free") : `CHF ${tier.annual.toLocaleString("de-CH")}`}
                    </p>
                    {tier.annual > 0 && <p className="text-xs text-muted-foreground">/{t("church.perYear")}</p>}
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{t(f)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                  >
                    <a href="mailto:kontakt@biblebot.life?subject=Church%20Partnership">
                      <Send className="h-4 w-4 mr-2" />
                      {t("church.contact")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer link */}
      <div className="py-8 text-center">
        <Link to="/churches" className="text-primary hover:underline text-sm font-medium">
          {t("church.viewDirectory")} →
        </Link>
      </div>
    </div>
  );
};

export default ForChurches;
