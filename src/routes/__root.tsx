// ported from main.tsx
import "@/i18n";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { applyDetectedLanguage } from "@/i18n";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import { VoiceFloatingButton } from "@/components/VoiceFloatingButton";
import { AuthProvider } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/SplashScreen";
import { useChurchBranding, hexToHsl } from "@/hooks/use-church-branding";
import ScrollToTop from "@/components/ScrollToTop";
import { HostRedirect } from "@/components/HostRedirect";
import NotFound from "@/pages/NotFound";

const SITE = "https://biblebot.life";
const TITLE = "Bibel-Bot & Bibel-Chat auf Deutsch – kostenlos, ohne Login | BibleBot.Life";
const DESCRIPTION =
  "Der Bibel-Bot zum Chatten: Fragen stellen, Antworten mit geprüften Bibelstellen aus 5 Übersetzungen. Kostenlos, anonym, ohne Login – mit täglichem Impuls.";
const OG_TITLE = "BibleBot.Life – Kostenloser Bibel-Bot auf Deutsch";
const OG_DESCRIPTION =
  "Bibel-Bot mit 5 deutschen Übersetzungen, täglichen Impulsen, Coaching-Fragen, Gebet & Reflexion. Anonym, kostenlos, 37+ Sprachen.";
const OG_IMAGE = `${SITE}/og-image-de.png`;
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap";
const BACKEND_ORIGIN = "https://swsthxftugjqznqjcfpk.supabase.co";

const HREFLANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro", "da", "no", "sv", "fi", "el", "hr", "sr", "hu",
  "sk", "bg", "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh", "sw", "am", "af", "yo", "ig", "zu", "ht", "ar",
];

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "BibleBot.Life",
      url: SITE,
      logo: `${SITE}/favicon-gold.png`,
      description: "Dein persönlicher Begleiter — mit der Tiefe der Bibel, ohne Vorkenntnisse.",
    },
    {
      "@type": "WebApplication",
      name: "BibleBot.Life",
      url: SITE,
      description:
        "Dein persönlicher Begleiter — mit der Tiefe der Bibel, ohne Vorkenntnisse. 5 Übersetzungen, tägliche Impulse, Coaching. Kostenlos, anonym, 36 Sprachen.",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "All",
      offers: { "@type": "Offer", price: "0", priceCurrency: "CHF" },
      inLanguage: HREFLANGS,
      creator: { "@type": "Organization", name: "BibleBot.Life" },
      image: `${SITE}/og-image.png`,
    },
  ],
};

const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "google-site-verification", content: "NGHhCKgn6AtaWgpCIWIL_PBk-3urR6YcBwviWudK23w" },
      { name: "author", content: "BibleBot.Life" },
      { name: "theme-color", content: "#D4911A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "BibleBot" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:site_name", content: "BibleBot.Life" },
      { property: "og:locale", content: "de_CH" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:locale:alternate", content: "fr_FR" },
      { property: "og:locale:alternate", content: "es_ES" },
      { property: "og:locale:alternate", content: "it_IT" },
      { property: "og:title", content: OG_TITLE },
      { property: "og:description", content: OG_DESCRIPTION },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:secure_url", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "BibleBot.Life – Dein persönlicher Begleiter" },
      { property: "og:image:type", content: "image/png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: OG_TITLE },
      { name: "twitter:description", content: OG_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: "BibleBot.Life – Dein persönlicher Begleiter" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: FONTS_URL },
      { rel: "preconnect", href: BACKEND_ORIGIN, crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: BACKEND_ORIGIN },
      { rel: "canonical", href: `${SITE}/` },
      ...HREFLANGS.map((lng) => ({ rel: "alternate", hrefLang: lng, href: `${SITE}/?lng=${lng}` })),
      { rel: "alternate", hrefLang: "x-default", href: `${SITE}/` },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/favicon-gold.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-gold.png", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-dark-192.png", media: "(prefers-color-scheme: dark)" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon-gold.png", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(STRUCTURED_DATA) }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function shouldShowSplash(): boolean {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const hasChurchParam =
    new URLSearchParams(window.location.search).has("church") || !!localStorage.getItem("biblebot-church");
  const isFirstSession = !sessionStorage.getItem("biblebot-splash-shown");
  return isFirstSession && (isStandalone || hasChurchParam);
}

/** Switches to the visitor's language after hydration and sets dir/lang on <html>. */
function DirectionManager() {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDetectedLanguage();
  }, []);

  useEffect(() => {
    const lang = i18n.language?.split("-")[0] ?? "de";
    const isRtl = RTL_LANGUAGES.includes(lang);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return null;
}

/** Applies church branding colors as CSS custom properties */
function ChurchColorOverride() {
  const { branding } = useChurchBranding();

  useEffect(() => {
    const root = document.documentElement;
    if (branding?.primaryColor) {
      const hsl = hexToHsl(branding.primaryColor);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--primary-foreground", "0 0% 100%");
      }
    }
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
    };
  }, [branding?.primaryColor]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (shouldShowSplash()) {
      sessionStorage.setItem("biblebot-splash-shown", "1");
      setShowSplash(true);
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
          <AuthProvider>
            <AnalyticsProvider>
              <ScrollToTop />
              <HostRedirect />
              <DirectionManager />
              <ChurchColorOverride />
              <Outlet />
              <InstallPrompt />
              <VoiceFloatingButton />
            </AnalyticsProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">This page didn't load</h1>
        <p className="text-muted-foreground mb-6">Etwas ist schiefgelaufen. Bitte versuche es erneut.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <Link to="/" className="rounded-md border border-border px-4 py-2">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
