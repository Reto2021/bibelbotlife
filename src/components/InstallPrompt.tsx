import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pwa-install-dismissed";
const VISIT_KEY = "pwa-visit-count";
const MIN_VISITS = 2;

export const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Already installed as standalone?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // User dismissed before?
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Only mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Count visits
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));
    if (visits < MIN_VISITS) return;

    // Listen for beforeinstallprompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari fallback – no beforeinstallprompt event
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|Chrome/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!show) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-md bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">BibelBot installieren</p>
          <p className="text-xs text-muted-foreground">
            {isIOS
              ? "Tippe auf «Teilen» → «Zum Home-Bildschirm»"
              : "Schneller Zugriff direkt vom Startbildschirm"}
          </p>
        </div>
        {!isIOS && deferredPrompt && (
          <Button size="sm" onClick={handleInstall} className="shrink-0">
            Installieren
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Schliessen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
