import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthProvider } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/SplashScreen";
import { useChurchBranding, hexToHsl } from "@/hooks/use-church-branding";
import ScrollToTop from "@/components/ScrollToTop";
import { useTranslation } from "react-i18next";

const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];

// Lazy-load pages for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ForChurches = lazy(() => import("./pages/ForChurches"));
const ChurchDirectory = lazy(() => import("./pages/ChurchDirectory"));
const ChurchPartner = lazy(() => import("./pages/ChurchPartner"));
const ChurchIntegration = lazy(() => import("./pages/ChurchIntegration"));

const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const ServiceEditor = lazy(() => import("./pages/dashboard/ServiceEditor"));
const ServicesCalendar = lazy(() => import("./pages/dashboard/ServicesCalendar"));
const ResourceLibrary = lazy(() => import("./pages/dashboard/ResourceLibrary"));
const SeriesPage = lazy(() => import("./pages/dashboard/SeriesPage"));
const RecordsPage = lazy(() => import("./pages/dashboard/RecordsPage"));
const TeamPage = lazy(() => import("./pages/dashboard/TeamPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const InvoicesPage = lazy(() => import("./pages/dashboard/InvoicesPage"));
const ConductorMode = lazy(() => import("./pages/dashboard/ConductorMode"));
const TemplatesPage = lazy(() => import("./pages/dashboard/TemplatesPage"));
const MeinBereich = lazy(() => import("./pages/MeinBereich"));
const MeinBereichHome = lazy(() => import("./pages/mein-bereich/MeinBereichHome"));
const EulogyWriter = lazy(() => import("./pages/mein-bereich/EulogyWriter"));
const SharedDraft = lazy(() => import("./pages/SharedDraft"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const OutreachAdmin = lazy(() => import("./pages/admin/OutreachAdmin"));
const PrayerModeration = lazy(() => import("./pages/admin/PrayerModeration"));
const ReferralAdmin = lazy(() => import("./pages/admin/ReferralAdmin"));
const BibleSearch = lazy(() => import("./pages/BibleSearch"));
const PrayerWall = lazy(() => import("./pages/PrayerWall"));
const BibleQuiz = lazy(() => import("./pages/BibleQuiz"));
const WidgetPreview = lazy(() => import("./pages/WidgetPreview"));
const SplashPage = lazy(() => import("./pages/SplashPage"));
const ForCelebrants = lazy(() => import("./pages/ForCelebrants"));
const ReferralPartner = lazy(() => import("./pages/ReferralPartner"));

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Loading…</div>
  </div>
);

function shouldShowSplash(): boolean {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
  const hasChurchParam =
    new URLSearchParams(window.location.search).has("church") ||
    !!localStorage.getItem("biblebot-church");
  const isFirstSession = !sessionStorage.getItem("biblebot-splash-shown");
  return isFirstSession && (isStandalone || hasChurchParam);
}

/** Sets dir="rtl" on <html> when an RTL language is active */
function DirectionManager() {
  const { i18n } = useTranslation();

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
        // Auto-generate a lighter foreground for contrast on primary bg
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

const App = () => {
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash());

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem("biblebot-splash-shown", "1");
    }
  }, [showSplash]);

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <BrowserRouter>
          <AuthProvider>
            <AnalyticsProvider>
              <ScrollToTop />
              <DirectionManager />
              <ChurchColorOverride />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/impressum" element={<Impressum />} />
                  <Route path="/datenschutz" element={<Datenschutz />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/for-churches" element={<ForChurches />} />
                  <Route path="/churches" element={<ChurchDirectory />} />
                  <Route path="/church/:slug" element={<ChurchPartner />} />
                  <Route path="/church-integration/:slug" element={<ChurchIntegration />} />
                  <Route path="/for-institutions" element={<ForChurches />} />
                  <Route path="/fuer-seelsorger" element={<ForCelebrants />} />
                  <Route path="/bible-search" element={<BibleSearch />} />
                  <Route path="/gebetswand" element={<PrayerWall />} />
                  <Route path="/bibelquiz" element={<BibleQuiz />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                    <Route index element={<DashboardHome />} />
                    <Route path="editor/:id" element={<ServiceEditor />} />
                    <Route path="conductor/:id" element={<ConductorMode />} />
                    <Route path="services" element={<ServicesCalendar />} />
                    <Route path="resources" element={<ResourceLibrary />} />
                    <Route path="series" element={<SeriesPage />} />
                    <Route path="records" element={<RecordsPage />} />
                    <Route path="team" element={<TeamPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="invoices" element={<InvoicesPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                  </Route>
                  <Route path="/mein-bereich" element={<ProtectedRoute><MeinBereich /></ProtectedRoute>}>
                    <Route index element={<MeinBereichHome />} />
                    <Route path="abdankung" element={<EulogyWriter />} />
                  </Route>
                  <Route path="/shared/:token" element={<SharedDraft />} />
                  <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                  <Route path="/admin/outreach" element={<ProtectedAdminRoute><OutreachAdmin /></ProtectedAdminRoute>} />
                  <Route path="/admin/prayers" element={<ProtectedAdminRoute><PrayerModeration /></ProtectedAdminRoute>} />
                  <Route path="/admin/referrals" element={<ProtectedAdminRoute><ReferralAdmin /></ProtectedAdminRoute>} />
                  <Route path="/widget-preview/:leadId" element={<WidgetPreview />} />
                  <Route path="/partner/:code" element={<ReferralPartner />} />
                  <Route path="/splash/:churchSlug" element={<SplashPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <InstallPrompt />
            </AnalyticsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
