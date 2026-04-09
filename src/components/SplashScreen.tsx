import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import bibelbotLogo from "@/assets/biblebot-logo.png";

type PatronData = {
  name: string;
  logo_url: string | null;
  custom_bot_name: string | null;
};

const SPLASH_DURATION_WITH_PATRON = 4000;
const SPLASH_DURATION_DEFAULT = 1800;

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

    supabase
      .from("church_partners_public" as any)
      .select("name, logo_url, plan_tier, custom_bot_name")
      .eq("slug", slug)
      .eq("is_active", true)
      .neq("plan_tier", "free")
      .maybeSingle()
      .then(({ data }) => {
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

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <img src={bibelbotLogo} alt="BibleBot" className="h-16 w-16 sm:h-20 sm:w-20" width={512} height={512} />
            <div className="flex flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
              >
                {displayName}
              </motion.h1>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground/70 mt-1"
              >
                Everyday Sunday
              </motion.span>
            </div>
          </motion.div>

          {/* Patron section */}
          {patron && dataLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
                  {t("splash.patronage", "Empfohlen von")}
                </span>
                <div className="h-px w-10 bg-border" />
              </div>

              {patron.logo_url && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  src={patron.logo_url}
                  alt={patron.name}
                  className="h-14 w-auto max-w-[200px] object-contain"
                  loading="eager"
                />
              )}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.4 }}
                className="text-base font-medium text-foreground/80"
              >
                {patron.name}
              </motion.span>
            </motion.div>
          )}

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-12"
          >
            <div className="h-1 w-20 rounded-full bg-primary/20 overflow-hidden">
              <motion.div
                className="h-full bg-primary/40 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: patron ? 3.5 : 1.5,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
