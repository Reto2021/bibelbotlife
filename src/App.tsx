import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthProvider } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/SplashScreen";
import { useChurchBranding, hexToHsl } from "@/hooks/use-church-branding";

// Lazy-load pages for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ForChurches = lazy(() => import("./pages/ForChurches"));
const ChurchDirectory = lazy(() => import("./pages/ChurchDirectory"));
const ChurchPartner = lazy(() => import("./pages/ChurchPartner"));
const ChurchIntegration = lazy(() => import("./pages/ChurchIntegration"));
const ForInstitutions = lazy(() => import("./pages/ForInstitutions"));
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

import { ProtectedRoute } from "@/components/ProtectedRoute";

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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <BrowserRouter>
          <AuthProvider>
            <AnalyticsProvider>
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
                  <Route path="/for-institutions" element={<ForInstitutions />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                    <Route index element={<DashboardHome />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <InstallPrompt />
            </AnalyticsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
