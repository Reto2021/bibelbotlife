import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

type PatronData = {
  name: string;
  logo_url: string | null;
};

const SPLASH_DURATION_WITH_PATRON = 2500;
const SPLASH_DURATION_DEFAULT = 1500;

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
      .from("church_partners")
      .select("name, logo_url, plan_tier")
      .eq("slug", slug)
      .eq("is_active", true)
      .neq("plan_tier", "free")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPatron({ name: data.name, logo_url: data.logo_url });
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

  const handleExitComplete = () => {
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* BibelBot Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-5xl">📖</span>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              BibelBot.Life
            </h1>
          </motion.div>

          {/* Patron section */}
          {patron && dataLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">
                  {t("splash.patronage", "Empfohlen von")}
                </span>
                <div className="h-px w-8 bg-border" />
              </div>

              {patron.logo_url && (
                <img
                  src={patron.logo_url}
                  alt={patron.name}
                  className="h-12 w-auto max-w-[180px] object-contain"
                />
              )}
              <span className="text-sm font-medium text-foreground/80">
                {patron.name}
              </span>
            </motion.div>
          )}

          {/* Subtle loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-12"
          >
            <div className="h-1 w-16 rounded-full bg-primary/20 overflow-hidden">
              <motion.div
                className="h-full bg-primary/50 rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
