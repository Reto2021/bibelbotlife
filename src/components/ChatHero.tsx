import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import bibelbotLogo from "@/assets/biblebot-logo.png";
import { Search, ArrowRight, Shield, Loader2, Mic, MicOff, Send, Menu, LogIn, X, EyeOff, Heart, Accessibility, Volume2, VolumeX, CheckCircle2, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTTS } from "@/hooks/use-tts";

import { useSeniorMode } from "@/hooks/use-senior-mode";
import { motion, AnimatePresence } from "framer-motion";
import { useTrack } from "@/components/AnalyticsProvider";
import { openLifeWheel } from "@/components/LifeWheel";
import { CHAT_OPEN_EVENT, CHAT_RESET_EVENT, type ChatMode } from "@/lib/chat-events";
import ReactMarkdown from "react-markdown";
import { ShareButton } from "@/components/ShareButton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatHistory, type ChatMessage } from "@/hooks/use-chat-history";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useChurchBranding } from "@/hooks/use-church-branding";

const TYPEWRITER_SPEED = 45;
const PAUSE_BETWEEN = 2800;
const DELETE_SPEED = 25;

const DAILY_VERSES_COUNT = 14;

function getDailyVerseIndex() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % DAILY_VERSES_COUNT;
}

// getDailyVerse is now a hook-compatible function used inside the component

type TopicChip = { emoji: string; key: string; special?: "lifewheel" | "sevenwhys" };

const TOPIC_CHIPS: TopicChip[] = [
  // Casual / curiosity-driven (front)
  { emoji: "🤔", key: "namequiz" },
  { emoji: "☕", key: "dailywisdom" },
  { emoji: "🌅", key: "morningstart" },
  { emoji: "🎲", key: "funfact" },
  { emoji: "💡", key: "lifehack" },
  { emoji: "🌟", key: "strengths" },
  { emoji: "✨", key: "inspiration" },
  { emoji: "🎡", key: "lifewheel", special: "lifewheel" },
  { emoji: "👨‍👩‍👧", key: "family" },
  { emoji: "😴", key: "relax" },
  { emoji: "📜", key: "quoteofday" },
  { emoji: "🙏", key: "thankfulness" },
  { emoji: "❓", key: "biblesays" },
  // Deeper topics
  { emoji: "🙌", key: "gratitude" },
  { emoji: "🎊", key: "joy" },
  { emoji: "📖", key: "bibleverse" },
  { emoji: "🔍", key: "sevenwhys", special: "sevenwhys" },
  { emoji: "🙏", key: "prayer" },
  { emoji: "💔", key: "heartbreak" },
  { emoji: "😰", key: "anxiety" },
  { emoji: "🌅", key: "newstart" },
  { emoji: "🕊️", key: "baptism" },
  { emoji: "💐", key: "condolence" },
  { emoji: "💍", key: "wedding" },
  { emoji: "🫂", key: "loneliness" },
  { emoji: "⚖️", key: "decision" },
  { emoji: "😡", key: "anger" },
  { emoji: "😢", key: "burnout" },
  { emoji: "🧭", key: "calling" },
  { emoji: "⛪", key: "faithdoubt" },
  { emoji: "🤝", key: "forgiveness" },
];

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function getSpeechLang(lang: string): string {
  const map: Record<string, string> = { de: "de-CH", en: "en-US", fr: "fr-FR", es: "es-ES" };
  return map[lang] || "de-CH";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-chat`;
const QA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-qa`;

type QAResult = {
  citations_found: number;
  issues: { citation: string; problem: string; correction: string }[];
  has_issues: boolean;
  summary: string;
};

function likelyHasCitations(text: string): boolean {
  const pattern = /(\d\.\s?)?(Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Ps|Spr|Jes|Jer|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Jude|Revelation)\s+\d+/i;
  return pattern.test(text);
}

function QABadge({ qa, t }: { qa: QAResult | "loading" | "skipped"; t: (key: string, opts?: any) => string }) {
  const [showExtended, setShowExtended] = useState(() => {
    return !localStorage.getItem("biblebot-qa-explained");
  });

  useEffect(() => {
    if (showExtended && qa !== "loading" && qa !== "skipped" && typeof qa === "object" && !qa.has_issues) {
      localStorage.setItem("biblebot-qa-explained", "1");
      const timer = setTimeout(() => setShowExtended(false), 9000);
      return () => clearTimeout(timer);
    }
  }, [showExtended, qa]);

  if (qa === "loading") {
    return (
      <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{t("chat.qaChecking")}</span>
      </div>
    );
  }
  if (qa === "skipped") return null;
  if (qa.citations_found === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg border cursor-help text-sm font-medium ${qa.has_issues ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"}`}>
            {qa.has_issues ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>
              {qa.has_issues
                ? t("chat.qaIssue", { count: qa.issues.length })
                : showExtended
                  ? `BibleBot prüft jede Bibelstelle automatisch. ${qa.citations_found} Stelle(n) in dieser Antwort geprüft und bestätigt.`
                  : t("chat.qaOk", { count: qa.citations_found })}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] text-xs">
          {qa.has_issues ? (
            <div className="space-y-2">
              <p className="font-semibold">{t("chat.qaWarning")}</p>
              {qa.issues.map((issue, i) => (
                <div key={i} className="border-t border-border pt-1.5">
                  <p className="font-medium">{issue.citation}</p>
                  <p className="text-muted-foreground">{issue.problem}</p>
                  {issue.correction && <p className="text-foreground mt-0.5">→ {issue.correction}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p>{qa.summary}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const BIBLE_REF_PATTERN = /(\d\.\s?)?(?:Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Ps|Spr|Jes|Jer)\s+\d+(?:[,:]\d+(?:[\-–]\d+)?)?/g;

function makeRefsClickable(children: React.ReactNode, onRefClick: (msg: string) => void, explainTemplate?: string): React.ReactNode {
  if (!children) return children;
  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      const regex = new RegExp(BIBLE_REF_PATTERN.source, "g");
      let match;
      while ((match = regex.exec(node)) !== null) {
        if (match.index > lastIndex) parts.push(node.slice(lastIndex, match.index));
        const ref = match[0];
        parts.push(
          <button key={`ref-${match.index}`} onClick={(e) => { e.preventDefault(); onRefClick((explainTemplate || `Explain {{ref}} in detail`).replace("{{ref}}", ref)); }} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer font-medium">{ref}</button>
        );
        lastIndex = regex.lastIndex;
      }
      if (parts.length === 0) return node;
      if (lastIndex < node.length) parts.push(node.slice(lastIndex));
      return <>{parts}</>;
    }
    if (Array.isArray(node)) return node.map((child, i) => <span key={i}>{processNode(child)}</span>);
    return node;
  };
  if (Array.isArray(children)) return children.map((child, i) => <span key={i}>{processNode(child)}</span>);
  return processNode(children);
}

function extractOptions(text: string): { cleanText: string; options: string[] } {
  const linePatterns: { line: RegExp; strip: RegExp }[] = [
    { line: /^(\*{0,2})[a-z]\)\1\s+.+$/gm, strip: /^(\*{0,2})[a-z]\)\1\s+/ },
    { line: /^(\*{0,2})[A-Z]\)\1\s+.+$/gm, strip: /^(\*{0,2})[A-Z]\)\1\s+/ },
    { line: /^(\*{0,2})\d+[\).]\1\s+.+$/gm, strip: /^(\*{0,2})\d+[\).]\1\s+/ },
    { line: /^[-–•]\s+.+$/gm, strip: /^[-–•]\s+/ },
  ];

  for (const { line, strip } of linePatterns) {
    line.lastIndex = 0;
    const matches = text.match(line);
    if (matches && matches.length >= 2) {
      let cleanText = text;
      for (const match of matches) cleanText = cleanText.replace(match, "");
      cleanText = cleanText.replace(/\n{3,}/g, "\n\n").trim();
      const options = matches
        .map((match) => match.replace(strip, "").replace(/\*{1,2}/g, "").trim())
        .filter((option) => option.length > 2);

      if (options.length >= 2) return { cleanText, options };
    }
  }

  const flat = text.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();
  const inlineMarkerRe = /(\*{0,2}[a-zA-Z]\)\*{0,2}\s+|\*{0,2}\d+[\).]\*{0,2}\s+)/g;
  const markers = [...flat.matchAll(inlineMarkerRe)];

  if (markers.length >= 2) {
    const firstIndex = markers[0].index ?? -1;
    if (firstIndex >= 0) {
      const cleanText = flat.slice(0, firstIndex).trim();
      const options = markers
        .map((marker, index) => {
          const start = (marker.index ?? 0) + marker[0].length;
          const end = index + 1 < markers.length ? (markers[index + 1].index ?? flat.length) : flat.length;
          return flat
            .slice(start, end)
            .replace(/\*{1,2}/g, "")
            .replace(/[.?!,;:]\s*$/, "")
            .trim();
        })
        .filter((option) => option.length > 2);

      if (options.length >= 2) return { cleanText, options };
    }
  }

  return { cleanText: text, options: [] };
}

// Auto-typing demo that creates a "wow moment" in the first few seconds
function LiveDemoPreview({ onTryIt }: { onTryIt: () => void }) {
  const { t } = useTranslation();
  const userMsg = t("chatDemo.userMsg");
  const botMsg = t("chatDemo.botMsg");
  const [phase, setPhase] = useState<"user" | "typing" | "bot" | "done">("user");
  const [botText, setBotText] = useState("");
  const botCharRef = useRef(0);

  useEffect(() => {
    setPhase("user");
    setBotText("");
    botCharRef.current = 0;

    let interval: ReturnType<typeof setInterval> | undefined;
    const t1 = setTimeout(() => setPhase("typing"), 800);
    const t2 = setTimeout(() => {
      setPhase("bot");
      interval = setInterval(() => {
        botCharRef.current += 2;
        if (botCharRef.current >= botMsg.length) {
          setBotText(botMsg);
          clearInterval(interval);
          setTimeout(() => setPhase("done"), 400);
        } else {
          setBotText(botMsg.slice(0, botCharRef.current));
        }
      }, 20);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (interval) clearInterval(interval);
    };
  }, [userMsg, botMsg]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="max-w-2xl mx-auto w-full mb-5"
    >
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/60 p-3 sm:p-4 space-y-2.5">
        {/* User bubble */}
        <div className="flex justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-primary/10 border border-primary/15 rounded-2xl rounded-br-md px-3 py-2 max-w-[80%]"
          >
            <p className="text-sm text-foreground">{userMsg}</p>
          </motion.div>
        </div>
        {/* Bot bubble */}
        {(phase === "typing" || phase === "bot" || phase === "done") && (
          <div className="flex justify-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%] shadow-sm"
            >
              {phase === "typing" ? (
                <div className="flex items-center gap-1 py-1 px-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              ) : (
                <p className="font-serif text-sm text-foreground/90 leading-relaxed">{botText}</p>
              )}
            </motion.div>
          </div>
        )}
        {/* CTA */}
        {phase === "done" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onTryIt}
            className="w-full text-center text-xs text-primary font-semibold hover:underline cursor-pointer pt-1"
          >
            {t("chatDemo.cta")}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}


export function ChatHero() {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [isListening, setIsListening] = useState(false);
  const [showMoreChips, setShowMoreChips] = useState(false);
  const [loginHintDismissed, setLoginHintDismissed] = useState(() => localStorage.getItem("biblebot-login-hint-dismissed") === "1");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);
  const { track } = useTrack();
  const { toast } = useToast();
  const { user } = useAuth();
  const { branding } = useChurchBranding();
  const { isSenior, toggle: toggleSenior } = useSeniorMode();
  const tts = useTTS();
  const [qaMap, setQaMap] = useState<Record<number, QAResult | "loading" | "skipped">>({});
  const [followUps, setFollowUps] = useState<{ emoji: string; label: string; prompt: string }[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  const runQA = useCallback(async (text: string, msgIndex: number) => {
    if (!likelyHasCitations(text)) {
      setQaMap((prev) => ({ ...prev, [msgIndex]: "skipped" }));
      return;
    }
    setQaMap((prev) => ({ ...prev, [msgIndex]: "loading" }));
    try {
      const resp = await fetch(QA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) { setQaMap((prev) => ({ ...prev, [msgIndex]: "skipped" })); return; }
      const qaResult: QAResult = await resp.json();
      setQaMap((prev) => ({ ...prev, [msgIndex]: qaResult }));
    } catch {
      setQaMap((prev) => ({ ...prev, [msgIndex]: "skipped" }));
    }
  }, []);
  const dailyVerseIdx = useMemo(() => getDailyVerseIndex(), []);
  const dailyVerse = useMemo(() => ({
    quote: t(`dailyVerses.v${dailyVerseIdx}`),
    ref: t(`dailyVerses.r${dailyVerseIdx}`),
  }), [dailyVerseIdx, t]);

  // Senior mode size classes
  const s = {
    text: isSenior ? "text-lg" : "text-sm",
    textXs: isSenior ? "text-sm" : "text-xs",
    heading: isSenior ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl",
    btnIcon: isSenior ? "h-6 w-6" : "h-4 w-4",
    btnSize: isSenior ? "h-12 w-12" : "h-10 w-10",
    inputText: isSenior ? "text-lg" : "text-sm",
    inputHeight: isSenior ? "min-h-[52px]" : "min-h-[40px]",
    msgPadding: isSenior ? "px-5 py-4" : "px-4 py-3",
    chipText: isSenior ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5",
  };
  // ── Smart Quick-CTA rotation ───────────────────────────────────
  const TILE_CLICKS_KEY = "bibelbot-tile-clicks";

  const getTileClicks = useCallback((): Record<string, { count: number; last: number }> => {
    try {
      const raw = localStorage.getItem(TILE_CLICKS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  const trackTileClick = useCallback((key: string) => {
    try {
      const clicks = getTileClicks();
      clicks[key] = { count: (clicks[key]?.count || 0) + 1, last: Date.now() };
      localStorage.setItem(TILE_CLICKS_KEY, JSON.stringify(clicks));
    } catch {}
    track("tile_click", { tile: key, source: "quick_cta" });
  }, [getTileClicks, track]);

  // Pool of light/casual tiles suitable for Quick CTAs
  const CTA_POOL: { emoji: string; key: string }[] = useMemo(() => [
    { emoji: "🤔", key: "namequiz" },
    { emoji: "☕", key: "dailywisdom" },
    { emoji: "🎲", key: "funfact" },
    { emoji: "🌅", key: "morningstart" },
    { emoji: "💡", key: "lifehack" },
    { emoji: "🌟", key: "strengths" },
    { emoji: "✨", key: "inspiration" },
    { emoji: "📜", key: "quoteofday" },
    { emoji: "🙏", key: "thankfulness" },
    { emoji: "❓", key: "biblesays" },
    { emoji: "🙌", key: "gratitude" },
    { emoji: "🎊", key: "joy" },
  ], []);

  const smartQuickCTAs = useMemo(() => {
    const clicks = getTileClicks();
    const hasHistory = Object.keys(clicks).length > 0;

    if (!hasHistory) {
      // First-time user: show defaults
      return [
        { emoji: "🤔", key: "namequiz" },
        { emoji: "☕", key: "dailywisdom" },
        { emoji: "🎲", key: "funfact" },
      ].map(c => ({
        ...c,
        title: t(`tiles.${c.key}.title`),
        desc: t(`tiles.${c.key}.desc`),
        prompt: t(`tiles.${c.key}.prompt`),
      }));
    }

    // Returning user: 1 familiar (most clicked) + 2 fresh (not yet clicked or least clicked)
    const poolWithScores = CTA_POOL.map(tile => ({
      ...tile,
      count: clicks[tile.key]?.count || 0,
      last: clicks[tile.key]?.last || 0,
    }));

    // Pick the favorite (most clicked, most recent as tiebreaker)
    const clicked = poolWithScores.filter(t => t.count > 0).sort((a, b) => b.count - a.count || b.last - a.last);
    const unclicked = poolWithScores.filter(t => t.count === 0);

    // Use day-of-year as seed for daily rotation of fresh tiles
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);

    const selected: { emoji: string; key: string }[] = [];

    // 1 familiar tile (favorite)
    if (clicked.length > 0) {
      selected.push(clicked[0]);
    }

    // Fill remaining 2-3 slots with fresh/unclicked tiles, rotated daily
    const freshPool = unclicked.length >= 2 ? unclicked : [
      ...unclicked,
      ...clicked.slice(1).sort((a, b) => a.last - b.last), // least recently used
    ];

    const needed = 3 - selected.length;
    for (let i = 0; i < needed && freshPool.length > 0; i++) {
      const idx = (dayOfYear + i) % freshPool.length;
      const pick = freshPool.splice(idx, 1)[0];
      if (pick && !selected.find(s => s.key === pick.key)) {
        selected.push(pick);
      } else if (freshPool.length > 0) {
        // If we picked a duplicate, grab the next one
        selected.push(freshPool.splice(0, 1)[0]);
      }
    }

    // Ensure we always have 3
    while (selected.length < 3) {
      const fallback = CTA_POOL.find(t => !selected.find(s => s.key === t.key));
      if (fallback) selected.push(fallback); else break;
    }

    return selected.map(c => ({
      ...c,
      title: t(`tiles.${c.key}.title`),
      desc: t(`tiles.${c.key}.desc`),
      prompt: t(`tiles.${c.key}.prompt`),
    }));
  }, [t, getTileClicks, CTA_POOL]);

  // Autocomplete suggestions
  const SUGGESTIONS = useMemo(() => {
    const topics = TOPIC_CHIPS.map(chip => ({
      type: "topic" as const,
      emoji: chip.emoji,
      label: t(`tiles.${chip.key}.title`),
      prompt: t(`tiles.${chip.key}.prompt`),
    }));
    const bibleRefs = [
      { ref: "Psalm 23", label: t("suggest.psalm23") },
      { ref: "John 3:16", label: t("suggest.joh316") },
      { ref: "Romans 8:28", label: t("suggest.rom828") },
      { ref: "Matthew 11:28", label: t("suggest.mt1128") },
      { ref: "Philippians 4:13", label: t("suggest.phil413") },
      { ref: "Isaiah 41:10", label: t("suggest.jes4110") },
      { ref: "1 Corinthians 13", label: t("suggest.1kor13") },
      { ref: "Proverbs 3:5", label: t("suggest.spr35") },
      { ref: "Joshua 1:9", label: t("suggest.jos19") },
      { ref: "Psalm 46:1", label: t("suggest.ps462") },
    ].map(b => ({
      type: "bible" as const,
      emoji: "📖",
      label: b.label,
      prompt: t("suggest.explainDetail", { ref: b.ref }),
    }));
    return [...topics, ...bibleRefs];
  }, [t]);

  const filteredSuggestions = useMemo(() => {
    if (!input.trim() || input.trim().length < 2) return [];
    const q = input.toLowerCase();
    return SUGGESTIONS.filter(s => s.label.toLowerCase().includes(q) || s.prompt.toLowerCase().includes(q)).slice(0, 6);
  }, [input, SUGGESTIONS]);

  const {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    isLoadingHistory,
    loadMessages,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    updateTitle,
    deleteConversation,
    startNewChat,
    searchConversations,
    loadConversations,
  } = useChatHistory();

  // Keep ref in sync
  useEffect(() => {
    conversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Re-run QA checks when loading a historical conversation
  useEffect(() => {
    if (isLoadingHistory || messages.length === 0) return;
    // Clear old QA map when conversation changes
    setQaMap({});
    // Run QA on all assistant messages
    messages.forEach((msg, idx) => {
      if (msg.role === "assistant") {
        runQA(msg.content, idx);
      }
    });
  }, [activeConversationId]); // only when conversation switches

  const hasConversation = messages.length > 0;

  const phrases = [
    t("chatHero.placeholder1"),
    t("chatHero.placeholder2"),
    t("chatHero.placeholder3"),
    t("chatHero.placeholder4"),
    t("chatHero.placeholder5"),
  ];

  const suggestions = [
    t("chatHero.suggestion1"),
    t("chatHero.suggestion2"),
    t("chatHero.suggestion3"),
  ];

  // Typewriter effect
  useEffect(() => {
    if (isFocused || hasConversation) return;
    const currentPhrase = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting) {
      if (placeholder.length < currentPhrase.length) {
        timeout = setTimeout(() => setPlaceholder(currentPhrase.slice(0, placeholder.length + 1)), TYPEWRITER_SPEED);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), PAUSE_BETWEEN);
      }
    } else {
      if (placeholder.length > 0) {
        timeout = setTimeout(() => setPlaceholder(placeholder.slice(0, -1)), DELETE_SPEED);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, phraseIndex, isFocused, phrases, hasConversation]);

  // Scroll to bottom
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      track("chat_hero_submit", { query: text.slice(0, 50) });

      const userMsg: ChatMessage = { role: "user", content: text.trim() };

      // Create or use existing conversation
      let convId = conversationIdRef.current;
      if (!convId) {
        convId = await createConversation(text.trim());
        conversationIdRef.current = convId;
      }

      // Save user message to DB
      await addMessage(convId, "user", text.trim());

      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ messages: allMessages, journeyDay: 1, language: i18n.language, mode: chatMode }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          const errMsg = resp.status === 429 ? t("chat.errorTooMany") : errData.error || t("chat.errorConnect");
          toast({ title: t("chat.errorTitle"), description: errMsg, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error("No stream");

        // Insert placeholder assistant message in DB
        await addMessage(convId, "assistant", "…");

        const upsertChunk = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

        try {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (json === "[DONE]") break;
              try {
                const parsed = JSON.parse(json);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) upsertChunk(content);
              } catch {
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
        } catch (streamErr) {
          console.warn("Stream read failed, using fallback:", streamErr);
          const fallbackResp = await fetch(CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ messages: allMessages, journeyDay: 1, language: i18n.language, mode: chatMode }),
          });
          const fullText = await fallbackResp.text();
          for (const line of fullText.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) upsertChunk(content);
            } catch { /* skip */ }
          }
        }

        // Update the DB with final assistant content
        if (assistantSoFar && convId) {
          await updateLastAssistantMessage(convId, assistantSoFar);
          // Run QA check on the assistant response
          const assistantMsgIndex = allMessages.length; // index of the assistant message in the messages array
          runQA(assistantSoFar, assistantMsgIndex);

          // Generate follow-up suggestions
          setFollowUps([]);
          setFollowUpsLoading(true);
          fetch(CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({
              messages: [
                { role: "user", content: text.trim() },
                { role: "assistant", content: assistantSoFar.slice(0, 800) },
              ],
              mode: "generate_followups",
              language: i18n.language,
            }),
          })
            .then(r => r.ok ? r.json() : { suggestions: [] })
            .then(data => setFollowUps(data.suggestions || []))
            .catch(() => setFollowUps([]))
            .finally(() => setFollowUpsLoading(false));

          // Generate AI title after the first exchange (only 1 user + 1 assistant message)
          if (allMessages.length === 1) {
            try {
              const titleResp = await fetch(CHAT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
                body: JSON.stringify({
                  messages: [
                    { role: "user", content: text.trim() },
                    { role: "assistant", content: assistantSoFar.slice(0, 500) },
                  ],
                  mode: "generate_title",
                }),
              });
              if (titleResp.ok) {
                const { title } = await titleResp.json();
                if (title) await updateTitle(convId, title);
              }
            } catch (e) {
              console.error("Title generation failed:", e);
            }
          }
        }
      } catch (e) {
        console.error(e);
        toast({ title: t("chat.errorTitle"), description: t("chat.errorConnection"), variant: "destructive" });
      } finally {
        setIsLoading(false);
        loadConversations();
      }
    },
    [messages, isLoading, toast, t, i18n.language, chatMode, track, createConversation, addMessage, updateLastAssistantMessage, updateTitle, setMessages, loadConversations, runQA]
  );

  // Listen for external chat open events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const msg = typeof detail === "string" ? detail : detail?.message;
      const mode: ChatMode = typeof detail === "string" ? "normal" : (detail?.mode || "normal");
      setChatMode(mode);
      startNewChat();
      setTimeout(() => sendMessage(msg), 100);
    };
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, [sendMessage, startNewChat]);

  // Listen for chat reset (logo click)
  useEffect(() => {
    const handler = () => {
      setChatMode("normal");
      startNewChat();
      inputRef.current?.focus();
    };
    window.addEventListener(CHAT_RESET_EVENT, handler);
    return () => window.removeEventListener(CHAT_RESET_EVENT, handler);
  }, [startNewChat]);

  const handleChipClick = (chip: TopicChip) => {
    track("chip_click", { chip: chip.key });
    if (chip.special === "lifewheel") {
      openLifeWheel();
      return;
    }
    const prompt = t(`tiles.${chip.key}.prompt`);
    if (chip.special === "sevenwhys") setChatMode("seven-whys");
    sendMessage(prompt);
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      sendMessage(text);
    },
    [input, sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLang(i18n.language);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => { const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(""); setInput(transcript); };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [i18n.language]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  const handleSelectConversation = useCallback((id: string) => {
    loadMessages(id);
    setSidebarOpen(false);
  }, [loadMessages]);

  const handleNewChat = useCallback(() => {
    startNewChat();
    setSidebarOpen(false);
    setFollowUps([]);
  }, [startNewChat]);

  const visibleChips = showMoreChips ? TOPIC_CHIPS : TOPIC_CHIPS.slice(0, 8);

  return (
    <>
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={deleteConversation}
        onSearch={searchConversations}
      />

      <section className="relative px-4 min-h-[calc(100vh-64px)] flex flex-col" style={{ backgroundImage: "radial-gradient(circle at 60% 20%, hsl(32 65% 52% / 0.06) 0%, transparent 60%), radial-gradient(circle at 20% 80%, hsl(185 45% 35% / 0.05) 0%, transparent 55%)" }}>
        {/* History toggle button */}
        {conversations.length > 0 && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shadow-sm"
            title={t("chat.history", "Gespräche")}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="container mx-auto max-w-3xl flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {!hasConversation ? (
              /* ========== LANDING STATE ========== */
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                className="flex-1 flex flex-col justify-center py-4 sm:py-8"
              >
                {/* Title – instant, no delay */}
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-2 sm:mb-3 leading-tight text-center"
                >
                  {t("hero.title1")}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--gradient-cta)" }}>
                    {t("hero.title2")}
                  </span>
                </motion.h1>

                {/* Compact trust badges – inline */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="mb-4 sm:mb-6 text-center">
                  <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("hero.badge.optionalLogin")}</span>
                    <span className="text-primary/30">·</span>
                    <EyeOff className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("hero.badge.noData")}</span>
                    <span className="text-primary/30">·</span>
                    <Heart className="h-3 w-3 text-primary shrink-0" />
                    <span>{t("hero.badge.noJudgment")}</span>
                  </span>
                </motion.div>

                {/* Search input – appears fast */}
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="relative max-w-2xl mx-auto mb-5 w-full"
                >
                  <div className={`relative flex items-center bg-card border-2 rounded-2xl shadow-lg transition-all duration-300 ${
                    isFocused ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]" : "border-border hover:border-primary/40"
                  }`}>
                    <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); setSelectedSuggestion(-1); }}
                      onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
                      onBlur={() => { setIsFocused(false); setTimeout(() => setShowSuggestions(false), 200); }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown" && filteredSuggestions.length > 0) {
                          e.preventDefault();
                          setSelectedSuggestion(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSelectedSuggestion(prev => Math.max(prev - 1, -1));
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (selectedSuggestion >= 0 && filteredSuggestions[selectedSuggestion]) {
                            const sg = filteredSuggestions[selectedSuggestion];
                            setInput("");
                            setShowSuggestions(false);
                            sendMessage(sg.prompt);
                          } else {
                            handleSubmit(e);
                          }
                        } else if (e.key === "Escape") {
                          setShowSuggestions(false);
                        }
                      }}
                      placeholder={isFocused ? t("chatHero.focusPlaceholder") : placeholder + "│"}
                      className="w-full bg-transparent pl-12 pr-24 py-4 md:pl-14 md:py-5 text-base md:text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none rounded-2xl"
                      aria-label={t("chatHero.ariaLabel")}
                      autoComplete="off"
                    />
                    <div className="absolute right-3 flex items-center gap-1.5">
                      {SpeechRecognition && (
                        <button
                          type="button"
                          onClick={isListening ? stopListening : startListening}
                          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${isListening ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all duration-200 hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                   </div>
                  {/* Autocomplete suggestions */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div ref={suggestionsRef} className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      {filteredSuggestions.map((sg, i) => (
                        <button
                          key={`${sg.type}-${i}`}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setInput(""); setShowSuggestions(false); sendMessage(sg.prompt); }}
                          onMouseEnter={() => setSelectedSuggestion(i)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            i === selectedSuggestion ? "bg-primary/10 text-foreground" : "text-foreground/80 hover:bg-muted"
                          }`}
                        >
                          <span className="text-lg shrink-0">{sg.emoji}</span>
                          <span className={`${isSenior ? "text-base" : "text-sm"} truncate`}>{sg.label}</span>
                          <span className={`ml-auto ${isSenior ? "text-sm" : "text-xs"} text-muted-foreground shrink-0`}>
                            {sg.type === "bible" ? "📖" : "💬"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.form>

                {/* === Quick CTAs – smart rotation === */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="flex flex-col sm:grid sm:grid-cols-3 gap-2 max-w-2xl mx-auto mb-5 w-full"
                >
                  {smartQuickCTAs.map((card) => (
                    <button
                      key={card.key}
                      onClick={() => { trackTileClick(card.key); sendMessage(card.prompt); }}
                      className="group flex items-center gap-3 sm:gap-2 bg-card/70 backdrop-blur-sm border border-border rounded-xl px-4 sm:px-3 py-3 sm:py-2.5 hover:border-primary/40 hover:shadow-md hover:bg-card transition-all duration-200 cursor-pointer min-w-0"
                    >
                      <span className="text-xl sm:text-xl shrink-0">{card.emoji}</span>
                      <div className="text-left min-w-0">
                        <span className="text-sm sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight block">{card.title}</span>
                        <span className="text-xs text-muted-foreground leading-snug line-clamp-1 sm:hidden block">{card.desc}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>

                {/* === Live Demo – auto-typing wow moment === */}
                <LiveDemoPreview key={i18n.resolvedLanguage || i18n.language} onTryIt={() => inputRef.current?.focus()} />

                {/* === Social Proof – inline compact === */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="flex justify-center gap-6 sm:gap-10 mb-4 max-w-2xl mx-auto"
                >
                  {[
                    { value: "2'500+", label: t("social.conversations") },
                    { value: "36", label: t("social.languages") },
                    { value: "5", label: t("social.bibles") },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-primary">{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Topic chips */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5 }} className="max-w-2xl mx-auto mb-4">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {visibleChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={() => handleChipClick(chip)}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all duration-200"
                      >
                        <span>{chip.emoji}</span>
                        <span>{t(`tiles.${chip.key}.title`)}</span>
                      </button>
                    ))}
                    {!showMoreChips && (
                      <button onClick={() => setShowMoreChips(true)} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card/50 text-primary hover:bg-card transition-all duration-200">
                        +{TOPIC_CHIPS.length - 8} {t("tiles.showMore")}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Bible quote – compact */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.6 }} className="max-w-2xl mx-auto w-full">
                  <button
                    onClick={() => sendMessage(t("verseExplain", { quote: dailyVerse.quote, ref: dailyVerse.ref }))}
                    className="relative w-full bg-card/40 backdrop-blur-sm rounded-xl px-6 py-4 border border-primary/10 text-center overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
                  >
                    <p className="text-foreground/70 italic text-sm sm:text-base leading-relaxed font-serif">{dailyVerse.quote}</p>
                    <p className="text-primary/50 text-xs mt-1.5 font-medium">– {dailyVerse.ref}</p>
                  </button>
                </motion.div>

                {/* Previous conversations hint */}
                {conversations.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center mt-4">
                    <button onClick={() => setSidebarOpen(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                      {t("chat.previousChats", { count: conversations.length })}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ========== CHAT STATE ========== */
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col py-4 min-h-0">
                {/* Church branding header */}
                {branding && (
                  <div className="flex items-center gap-2.5 mb-3 px-1">
                    {branding.logoUrl && (
                      <img src={branding.logoUrl} alt="" className="h-7 w-7 object-contain rounded" loading="lazy" />
                    )}
                    <span className="text-sm font-semibold text-foreground">{branding.botName}</span>
                    <a href={`/church/${branding.churchSlug}`} className="text-xs text-muted-foreground hover:text-foreground ml-auto transition-colors">
                      {branding.churchName} →
                    </a>
                  </div>
                )}
                {isLoadingHistory ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 scroll-smooth">
                    {messages.map((msg, i) => {
                      const { cleanText, options } = msg.role === "assistant"
                        ? extractOptions(msg.content)
                        : { cleanText: msg.content, options: [] as string[] };

                      return (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                        {msg.role === "assistant" && (
                          <img src={branding?.logoUrl || bibelbotLogo} alt="" className="h-6 w-6 rounded-full shrink-0 mt-1" />
                        )}
                        <div className="max-w-[85%] md:max-w-[75%]">
                          <div className={`rounded-2xl ${s.msgPadding} ${s.text} leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border text-foreground rounded-bl-md"
                          }`}>
                            {msg.role === "assistant" ? (
                              <div className={`prose max-w-none dark:prose-invert font-serif ${isSenior ? "prose-lg" : "prose-sm"}`}>
                                <ReactMarkdown components={{
                                  p: ({ children }) => <p>{makeRefsClickable(children, sendMessage, t("suggest.explainDetail", { ref: "{{ref}}" }))}</p>,
                                  li: ({ children }) => <li>{makeRefsClickable(children, sendMessage, t("suggest.explainDetail", { ref: "{{ref}}" }))}</li>,
                                }}>{cleanText}</ReactMarkdown>
                              </div>
                            ) : msg.content}
                          </div>
                          {msg.role === "assistant" && options.length > 0 && (
                            <div className="mt-2 flex flex-col gap-1.5">
                              {options.map((option, optionIndex) => (
                                <button
                                  key={`${i}-${optionIndex}`}
                                  onClick={() => sendMessage(option)}
                                  className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-primary/20 bg-accent/30 hover:bg-accent hover:border-primary/40 text-foreground transition-all duration-200"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                          {msg.role === "assistant" && (
                            <>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => tts.play(msg.content)}
                                  disabled={tts.isLoading}
                                  className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  aria-label={tts.isPlaying ? t("chat.stopAudio", "Stoppen") : t("chat.playAudio", "Vorlesen")}
                                  title={tts.isPlaying ? t("chat.stopAudio", "Stoppen") : t("chat.playAudio", "Vorlesen")}
                                >
                                  {tts.isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : tts.isPlaying ? (
                                    <VolumeX className="h-3.5 w-3.5" />
                                  ) : (
                                    <Volume2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <ShareButton title={t("share.chatTitle")} text={msg.content.length > 280 ? msg.content.slice(0, 277) + "…" : msg.content} variant="icon" className="ml-auto" />
                              </div>
                              {qaMap[i] && <QABadge qa={qaMap[i]} t={t} />}
                            </>
                          )}
                        </div>
                      </div>
                    )})}

                    {/* Follow-up suggestion buttons */}
                    {!isLoading && messages.length >= 2 && messages[messages.length - 1]?.role === "assistant" && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="flex flex-wrap gap-2 px-1"
                      >
                        {followUpsLoading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>{t("chat.suggestionsLoading", "Vorschläge laden…")}</span>
                          </div>
                        ) : (
                          followUps.map((fu, i) => (
                            <button
                              key={i}
                              onClick={() => { setFollowUps([]); sendMessage(fu.prompt); }}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border bg-card/70 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-foreground transition-all duration-200 shadow-sm"
                            >
                              <span>{fu.emoji}</span>
                              <span>{fu.label}</span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}

                    {/* Login hint for anonymous users after first exchange */}
                    {!user && messages.length >= 2 && !isLoading && !loginHintDismissed && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: 1, duration: 0.4 }}
                        className="flex justify-center"
                      >
                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-card/60 border border-border/50 rounded-full px-4 py-2">
                          <LogIn className="h-3 w-3 shrink-0" />
                          <a
                            href="/login"
                            className="hover:text-foreground transition-colors"
                          >
                            {t("chat.loginHint", "Melde dich an, um Gespräche auf allen Geräten zu behalten")}
                          </a>
                          <button
                            onClick={() => {
                              localStorage.setItem("biblebot-login-hint-dismissed", "1");
                              setLoginHintDismissed(true);
                            }}
                            className="h-4 w-4 shrink-0 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                            aria-label="Schliessen"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex justify-start">
                        <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{t("chat.writing")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat input */}
                <div className="border-t border-border pt-3 mt-auto">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("chat.placeholder")}
                      className={`${s.inputHeight} max-h-[120px] ${s.inputText} resize-none`}
                      rows={isSenior ? 2 : 1}
                    />
                    {SpeechRecognition && (
                      <Button size="icon" variant={isListening ? "destructive" : "outline"} onClick={isListening ? stopListening : startListening} className={`${s.btnSize} shrink-0`}>
                        {isListening ? <MicOff className={s.btnIcon} /> : <Mic className={s.btnIcon} />}
                      </Button>
                    )}
                    <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className={`${s.btnSize} shrink-0`}>
                      <Send className={s.btnIcon} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleSenior}
                        className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors ${s.textXs} ${isSenior ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        aria-label={t("chat.seniorMode", "Grosse Schrift")}
                        title={t("chat.seniorMode", "Grosse Schrift")}
                      >
                        <Accessibility className={isSenior ? "h-5 w-5" : "h-4 w-4"} />
                        {isSenior && <span>{t("chat.seniorMode", "Grosse Schrift")}</span>}
                      </button>
                      
                    </div>
                    <button
                      onClick={() => { startNewChat(); }}
                      className={`${s.textXs} text-muted-foreground hover:text-foreground transition-colors`}
                    >
                      {t("chat.newChat", "Neues Gespräch starten")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
