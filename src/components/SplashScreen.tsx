import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLogo } from "@/components/AppLogo";

type PatronData = {
  name: string;
  logo_url: string | null;
  custom_bot_name: string | null;
};

const SPLASH_DURATION_WITH_PATRON = 7000;
const SPLASH_DURATION_DEFAULT = 3200;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [patron, setPatron] = useState<PatronData | null>(null);
  const [visible, setVisible] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const slug = localStorage.getItem("biblebot-church");
    if (!slug) {
      setDataLoaded(true);
      return;
    }

    (supabase
      .from("church_partners_public" as any)
      .select("name, logo_url, plan_tier, custom_bot_name")
      .eq("slug", slug)
      .neq("plan_tier", "free")
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (data) {
          setPatron({
            name: data.name,
            logo_url: data.logo_url,
            custom_bot_name: data.custom_bot_name,
          });
        }
        setDataLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    const duration = patron ? SPLASH_DURATION_WITH_PATRON : SPLASH_DURATION_DEFAULT;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [dataLoaded, patron]);

  const displayName = patron?.custom_bot_name || "BibleBot.Life";
  const tagline = t("splash.tagline", "Bibel. Täglich. Für dich.");

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background"
        >
          {/* Animated blob background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-32 -left-24 h-[70vw] w-[70vw] max-h-[520px] max-w-[520px] rounded-full opacity-60 blur-3xl animate-blob"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.55), transparent 70%)" }}
            />
            <div
              className="absolute -bottom-40 -right-20 h-[80vw] w-[80vw] max-h-[600px] max-w-[600px] rounded-full opacity-50 blur-3xl animate-blob-slow"
              style={{ background: "radial-gradient(circle, hsl(var(--secondary) / 0.5), transparent 70%)" }}
            />
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[60vw] w-[60vw] max-h-[420px] max-w-[420px] rounded-full opacity-40 blur-3xl animate-blob"
              style={{
                background: "radial-gradient(circle, hsl(var(--accent) / 0.7), transparent 70%)",
                animationDelay: "-4s",
              }}
            />
          </div>

          {/* Logo + Wordmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <AppLogo className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-lg" />
            </motion.div>

            <div className="flex flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="font-display text-5xl sm:text-6xl uppercase text-foreground leading-none tracking-wide"
              >
                {displayName.toUpperCase().replace(".LIFE", "")}
                <span className="text-primary">.life</span>
              </motion.h1>
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, letterSpacing: "0.35em" }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mt-3 text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground"
              >
                {tagline}
              </motion.span>
            </div>
          </motion.div>

          {/* Patron section */}
          {patron && dataLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="relative z-10 mt-12 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
                  {t("splash.patronage", "Empfohlen von")}
                </span>
                <div className="h-px w-10 bg-border" />
              </div>

              {patron.logo_url && (
                <img
                  src={patron.logo_url}
                  alt={patron.name}
                  className="h-14 w-auto max-w-[200px] object-contain"
                  loading="eager"
                />
              )}
              <span className="text-base font-medium text-foreground/80">{patron.name}</span>
            </motion.div>
          )}

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-12 z-10"
          >
            <div className="h-1 w-24 rounded-full bg-primary/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: patron ? 6.5 : 3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
