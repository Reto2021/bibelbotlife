import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { InstallPrompt } from "@/components/InstallPrompt";

// Lazy-load pages for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ForChurches = lazy(() => import("./pages/ForChurches"));
const ChurchDirectory = lazy(() => import("./pages/ChurchDirectory"));
const ChurchPartner = lazy(() => import("./pages/ChurchPartner"));
const ForInstitutions = lazy(() => import("./pages/ForInstitutions"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => {
  // Can't use useTranslation here (outside Suspense boundary for i18n)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/for-churches" element={<ForChurches />} />
              <Route path="/churches" element={<ChurchDirectory />} />
              <Route path="/church/:slug" element={<ChurchPartner />} />
              <Route path="/for-institutions" element={<ForInstitutions />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <InstallPrompt />
        </AnalyticsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
