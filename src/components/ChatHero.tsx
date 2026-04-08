import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, ArrowRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { openBibelBotChat } from "@/lib/chat-events";
import { useTrack } from "@/components/AnalyticsProvider";

const TYPEWRITER_SPEED = 45; // ms per char
const PAUSE_BETWEEN = 2800; // ms pause after full phrase
const DELETE_SPEED = 25; // ms per char when deleting

export function ChatHero() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { track } = useTrack();

  const phrases = [
    t("chatHero.placeholder1"),
    t("chatHero.placeholder2"),
    t("chatHero.placeholder3"),
    t("chatHero.placeholder4"),
    t("chatHero.placeholder5"),
  ];

  // Typewriter effect
  useEffect(() => {
    if (isFocused) return; // pause animation when user is typing

    const currentPhrase = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (placeholder.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setPlaceholder(currentPhrase.slice(0, placeholder.length + 1));
        }, TYPEWRITER_SPEED);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), PAUSE_BETWEEN);
      }
    } else {
      if (placeholder.length > 0) {
        timeout = setTimeout(() => {
          setPlaceholder(placeholder.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, phraseIndex, isFocused, phrases]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      track("chat_hero_submit", { query: text.slice(0, 50) });
      openBibelBotChat(text);
      setInput("");
    },
    [input, track]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      track("chat_hero_suggestion", { suggestion: suggestion.slice(0, 50) });
      openBibelBotChat(suggestion);
    },
    [track]
  );

  const suggestions = [
    t("chatHero.suggestion1"),
    t("chatHero.suggestion2"),
    t("chatHero.suggestion3"),
  ];

  return (
    <section className="relative py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-3 text-sm font-semibold text-foreground bg-card/80 backdrop-blur-sm border border-border shadow-md px-5 py-2.5 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <span className="flex items-center gap-2">
              <span>{t("hero.badge.noLogin")}</span>
              <span className="text-primary/40">·</span>
              <span>{t("hero.badge.noData")}</span>
              <span className="text-primary/40">·</span>
              <span>{t("hero.badge.noJudgment")}</span>
            </span>
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight"
        >
          {t("hero.title1")}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "var(--gradient-cta)" }}
          >
            {t("hero.title2")}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {t("chatHero.subtitle")}
        </motion.p>

        {/* Search input */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative max-w-2xl mx-auto mb-8"
        >
          <div
            className={`relative flex items-center bg-card border-2 rounded-2xl shadow-lg transition-all duration-300 ${
              isFocused
                ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                : "border-border hover:border-primary/40"
            }`}
          >
            <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? t("chatHero.focusPlaceholder") : placeholder + "│"}
              className="w-full bg-transparent pl-14 pr-14 py-5 text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none rounded-2xl"
              aria-label={t("chatHero.ariaLabel")}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-3 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all duration-200 hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={t("chatHero.send")}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </motion.form>

        {/* Quick suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="text-sm px-4 py-2 rounded-full border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </motion.div>

        {/* Bible quote */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-card/40 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/50">
            <p className="text-foreground/70 italic text-base leading-relaxed">
              {t("hero.quote")}
            </p>
            <p className="text-muted-foreground text-sm mt-1.5">{t("hero.quoteRef")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
