import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, X, MessageCircle, Loader2, Mic, MicOff, Pencil, Shield, Sparkles, CheckCircle2, AlertTriangle, Info, Accessibility, BookOpen } from "lucide-react";
import { useSeniorMode } from "@/hooks/use-senior-mode";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useTrack } from "@/components/AnalyticsProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

import { CHAT_OPEN_EVENT, type ChatMode } from "@/lib/chat-events";
export { openBibleBotChat } from "@/lib/chat-events";

const BIBLE_REF_PATTERN = /(\d\.\s?)?(?:Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Gen|Ex|Lev|Num|Dtn|Jos|Ri|Kön|Chr|Esr|Neh|Est|Ps|Spr|Pred|Hld|Jes|Jer|Klgl|Ez|Dan|Hos|Am|Ob|Jon|Mi|Nah|Hab|Zef|Hag|Sach|Mal|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Thess|Tim|Tit|Phlm|Hebr|Jak|Petr|Jud|Offb|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Jude|Revelation)\s+\d+(?:[,:]\d+(?:[\-–]\d+)?)?/g;

type QAResult = {
  citations_found: number;
  issues: { citation: string; problem: string; correction: string }[];
  has_issues: boolean;
  summary: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  qa?: QAResult | "loading" | "skipped";
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-chat`;
const QA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-qa`;

const JOURNEY_DISMISSED_KEY = "bibelbot-journey-dismissed";
const JOURNEY_NUDGE_KEY = "bibelbot-journey-nudge-ts";

function isJourneyDismissed(): boolean {
  try { return localStorage.getItem(JOURNEY_DISMISSED_KEY) === "1"; } catch { return false; }
}
function dismissJourney() {
  try { localStorage.setItem(JOURNEY_DISMISSED_KEY, "1"); } catch {}
}
function shouldNudgeJourney(): boolean {
  try {
    if (getJourneyDay() > 0) return false;
    if (!isJourneyDismissed()) return false;
    const lastNudge = localStorage.getItem(JOURNEY_NUDGE_KEY);
    if (!lastNudge) return true;
    return Date.now() - parseInt(lastNudge, 10) > 3 * 24 * 60 * 60 * 1000;
  } catch { return false; }
}
function markNudgeShown() {
  try { localStorage.setItem(JOURNEY_NUDGE_KEY, Date.now().toString()); } catch {}
}

const DEFAULT_BOT_NAME = "BibleBot";
const STORAGE_KEY = "bibelbot-name";

function getBotName(): string {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_BOT_NAME; } catch { return DEFAULT_BOT_NAME; }
}
function saveBotName(name: string) {
  try { localStorage.setItem(STORAGE_KEY, name); } catch {}
}

const AUTO_OPEN_KEY = "bibelbot-autoopened";
const MESSAGES_KEY = "bibelbot-messages";
const JOURNEY_START_KEY = "bibelbot-journey-start";
const JOURNEY_CHECKINS_KEY = "bibelbot-checkins";

function getJourneyDay(): number {
  try {
    const start = localStorage.getItem(JOURNEY_START_KEY);
    if (!start) return 0;
    const diff = Date.now() - parseInt(start, 10);
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  } catch { return 0; }
}
function startJourney() {
  try { if (!localStorage.getItem(JOURNEY_START_KEY)) localStorage.setItem(JOURNEY_START_KEY, Date.now().toString()); } catch {}
}
function getCheckins(): Record<number, number> {
  try { const stored = localStorage.getItem(JOURNEY_CHECKINS_KEY); if (stored) return JSON.parse(stored); } catch {} return {};
}
function saveCheckin(day: number, score: number) {
  try { const checkins = getCheckins(); checkins[day] = score; localStorage.setItem(JOURNEY_CHECKINS_KEY, JSON.stringify(checkins)); } catch {}
}

function likelyHasCitations(text: string): boolean {
  const pattern = /(\d\.\s?)?(Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Gen|Ex|Lev|Num|Dtn|Jos|Ri|Rut|Kön|Chr|Esr|Neh|Est|Ps|Spr|Pred|Hld|Jes|Jer|Klgl|Ez|Dan|Hos|Am|Ob|Jon|Mi|Nah|Hab|Zef|Hag|Sach|Mal|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Thess|Tim|Tit|Phlm|Hebr|Jak|Petr|Jud|Offb|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Jude|Revelation)\s+\d+/i;
  return pattern.test(text);
}

function QABadge({ qa, t }: { qa: QAResult | "loading" | "skipped"; t: (key: string, opts?: any) => string }) {
  if (qa === "loading") {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
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
          <div className={`flex items-center gap-1.5 mt-2 text-xs cursor-help ${qa.has_issues ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {qa.has_issues ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            <span>
              {qa.has_issues
                ? t("chat.qaIssue", { count: qa.issues.length })
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

function makeRefsClickable(children: React.ReactNode, onRefClick: (msg: string) => void): React.ReactNode {
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
          <button key={`ref-${match.index}`} onClick={(e) => { e.preventDefault(); onRefClick(`Erkläre mir ${ref} im Detail: Was ist der historische Kontext? Wer spricht? Was kommt davor und danach? Und was bedeutet das für mich heute?`); }} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer font-medium" title={`${ref} vertiefen`}>{ref}</button>
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

function loadMessages(): Message[] {
  try { const stored = localStorage.getItem(MESSAGES_KEY); if (stored) return JSON.parse(stored); } catch {} return [];
}
function saveMessages(msgs: Message[]) {
  try {
    const clean = msgs.map(({ qa, ...rest }) => ({ ...rest, ...(qa && qa !== "loading" ? { qa } : {}) }));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(clean));
  } catch {}
}

// Map i18n language code to speech recognition locale
function getSpeechLang(lang: string): string {
  const map: Record<string, string> = { de: "de-CH", en: "en-US", fr: "fr-FR", es: "es-ES" };
  return map[lang] || "de-CH";
}

export function BibleBotChat() {
  const { t, i18n } = useTranslation();
  const { isSenior, toggle: toggleSenior } = useSeniorMode();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [showTeaser, setShowTeaser] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [journeyDay, setJourneyDay] = useState(getJourneyDay);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [botName, setBotName] = useState(getBotName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showJourneyOffer, setShowJourneyOffer] = useState(false);
  const [showRenameTip, setShowRenameTip] = useState(false);
  const [preferredTranslation, setPreferredTranslation] = useState(() => {
    try { return localStorage.getItem("bibelbot-translation") || "auto"; } catch { return "auto"; }
  });
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { track } = useTrack();

  // Senior mode size classes
  const s = {
    text: isSenior ? "text-xl" : "text-sm",
    textXs: isSenior ? "text-base" : "text-xs",
    textSm: isSenior ? "text-lg" : "text-sm",
    btnSize: isSenior ? "h-14 w-14" : "h-10 w-10",
    btnIcon: isSenior ? "h-6 w-6" : "h-4 w-4",
    chatWidth: isSenior ? "w-[480px]" : "w-[390px]",
    chatHeight: isSenior ? "h-[680px]" : "h-[580px]",
    padding: isSenior ? "px-5 py-4" : "px-4 py-3",
    msgPadding: isSenior ? "px-5 py-4" : "px-4 py-2.5",
    inputRows: isSenior ? 2 : 1,
    fabSize: isSenior ? "h-20 w-20" : "h-16 w-16",
    fabIcon: isSenior ? "h-9 w-9" : "h-7 w-7",
  };

  const welcomeMessage: Message = { role: "assistant", content: t("chat.welcome") };
  const journeyOffer: Message = { role: "assistant", content: t("chat.journeyOffer") };
  const suggestions = [t("chat.suggestion1"), t("chat.suggestion2"), t("chat.suggestion3")];

  const runQA = useCallback(async (text: string, msgIndex: number) => {
    if (!likelyHasCitations(text)) {
      setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, qa: "skipped" } : m)));
      return;
    }
    setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, qa: "loading" } : m)));
    try {
      const resp = await fetch(QA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) { setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, qa: "skipped" } : m))); return; }
      const qaResult: QAResult = await resp.json();
      setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, qa: qaResult } : m)));
    } catch {
      setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, qa: "skipped" } : m)));
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) { toast({ title: t("subscribe.toastNotSupported"), description: t("chat.noVoice"), variant: "destructive" }); return; }
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
  }, [toast, t, i18n.language]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem(AUTO_OPEN_KEY);
    if (alreadyOpened) return;

    const isFirstEverVisit = !localStorage.getItem("bibelbot-visited");
    if (isFirstEverVisit) {
      localStorage.setItem("bibelbot-visited", "1");
    }

    const openDelay = isFirstEverVisit ? 1200 : 3000;
    const teaserDelay = isFirstEverVisit ? 400 : 1500;

    const teaserTimer = setTimeout(() => setShowTeaser(true), teaserDelay);
    const openTimer = setTimeout(() => { setIsOpen(true); setShowTeaser(false); sessionStorage.setItem(AUTO_OPEN_KEY, "1"); }, openDelay);
    return () => { clearTimeout(teaserTimer); clearTimeout(openTimer); };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showWelcome) {
      const timer = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, showWelcome]);

  useEffect(() => {
    if (messages.length >= 3 && journeyDay === 0 && !isJourneyDismissed() && !showJourneyOffer) {
      const timer = setTimeout(() => setShowJourneyOffer(true), 1500);
      return () => clearTimeout(timer);
    }
    if (messages.length >= 2 && journeyDay === 0 && shouldNudgeJourney() && !showJourneyOffer) {
      const timer = setTimeout(() => { setShowJourneyOffer(true); markNudgeShown(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, journeyDay, showJourneyOffer]);

  useEffect(() => {
    if (messages.length >= 2 && botName === DEFAULT_BOT_NAME && !showRenameTip) {
      const timer = setTimeout(() => setShowRenameTip(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, botName, showRenameTip]);

  useEffect(() => { if (messages.length > 0) saveMessages(messages); }, [messages]);
  useEffect(() => { if (isOpen) setShowTeaser(false); }, [isOpen]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, showWelcome]);

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) { setBotName(trimmed); saveBotName(trimmed); }
    setIsEditingName(false);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const currentDay = getJourneyDay();
      if (currentDay > 0 && currentDay <= 21) {
        const phase = currentDay <= 7 ? "ankommen" : currentDay <= 14 ? "vertiefen" : "handeln";
        track("journey_progress", { day: currentDay, phase });
      }
      if (currentDay > 21 && journeyDay <= 21) {
        track("journey_complete", { totalDays: 21 });
      }
      const userMsg: Message = { role: "user", content: text.trim() };
      const contextMessages = messages.length === 0 ? [welcomeMessage, userMsg] : [...messages, userMsg];
      setMessages(contextMessages);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ messages: contextMessages, journeyDay: journeyDay || 1, language: i18n.language, mode: chatMode }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          const errMsg = resp.status === 429 ? t("chat.errorTooMany") : resp.status === 402 ? t("chat.errorCredits") : errData.error || t("chat.errorConnect");
          toast({ title: t("chat.errorTitle"), description: errMsg, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error(t("chat.errorNoStream"));

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const upsert = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && prev.length > 1) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

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
              if (content) upsert(content);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        if (assistantSoFar) {
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (prev[lastIdx]?.role === "assistant") runQA(assistantSoFar, lastIdx);
            return prev;
          });
        }
      } catch (e) {
        console.error(e);
        toast({ title: t("chat.errorTitle"), description: `${botName} ${t("chat.errorConnection")}`, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, toast, botName, runQA, t, i18n.language, journeyDay, welcomeMessage, track]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const msg = typeof detail === "string" ? detail : detail?.message;
      const mode: ChatMode = typeof detail === "string" ? "normal" : (detail?.mode || "normal");
      setChatMode(mode);
      if (mode === "seven-whys") track("seven_whys_start", {});
      setIsOpen(true);
      setShowTeaser(false);
      setTimeout(() => sendMessage(msg), 300);
    };
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
        {showTeaser && (
          <div
            className="animate-in fade-in slide-in-from-right-4 duration-500 bg-card border border-primary/30 rounded-2xl rounded-br-md px-4 py-3 shadow-[0_4px_24px_hsl(var(--primary)/0.2)] max-w-[260px] cursor-pointer hover:shadow-[0_4px_32px_hsl(var(--primary)/0.3)] transition-shadow"
            onClick={() => setIsOpen(true)}
          >
            <p className={`${s.textSm} text-foreground font-semibold`}>{t("chat.teaser")}</p>
            <p className={`${s.textXs} text-muted-foreground mt-1`}>{t("chat.teaserSub")}</p>
            <p className={`${s.textXs} text-primary font-medium mt-2 flex items-center gap-1`}>
              <MessageCircle className="h-3 w-3" />
              {t("chat.teaserCta")}
            </p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className={`relative ${s.fabSize} rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_28px_hsl(var(--primary)/0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center`}
          aria-label={t("chat.openChat")}
        >
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2.5s" }} />
          <MessageCircle className={`${s.fabIcon} relative z-10`} />
        </button>
      </div>
    );
  }

  const hasConversation = messages.length > 0;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${s.chatWidth} max-w-[calc(100vw-2rem)] ${s.chatHeight} max-h-[calc(100vh-3rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${s.padding} border-b border-border bg-primary/5`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-telegram border-2 border-card" />
          </div>
          <div>
            {isEditingName ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveName(); }} className="flex items-center gap-1.5">
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="h-7 text-sm w-32 px-2 py-0.5 border-primary/40 focus:border-primary bg-primary/5 rounded-lg shadow-[0_0_8px_hsl(var(--primary)/0.2)] transition-shadow"
                  maxLength={20}
                  autoFocus
                  onBlur={handleSaveName}
                  placeholder={t("chat.namePlaceholder")}
                />
              </form>
            ) : (
              <button
                onClick={() => { setNameDraft(botName); setIsEditingName(true); }}
                className="flex items-center gap-1.5 group relative"
                title={t("chat.changeName")}
              >
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{botName}</p>
                <div className="relative">
                  <Pencil className="h-3 w-3 text-primary/60 group-hover:text-primary transition-all group-hover:scale-110" />
                  {botName === DEFAULT_BOT_NAME && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              {journeyDay > 0 && journeyDay <= 21
                ? `Tag ${journeyDay} von 21 · ${journeyDay <= 7 ? t("chat.arriving") : journeyDay <= 14 ? t("chat.deepening") : t("chat.acting")}`
                : journeyDay > 21
                  ? t("chat.journeyComplete")
                  : t("chat.yourCompanion")}
            </p>
            {journeyDay > 0 && (
              <div className="w-full bg-border rounded-full h-1 mt-1">
                <div className="bg-primary h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (journeyDay / 21) * 100)}%` }} />
              </div>
            )}
            {showRenameTip && botName === DEFAULT_BOT_NAME && (
              <div className="animate-fade-up mt-1.5 flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 cursor-pointer hover:bg-primary/15 transition-colors shadow-[0_0_12px_hsl(var(--primary)/0.15)]" onClick={() => { setNameDraft(botName); setIsEditingName(true); }}>
                <Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />
                <span className="text-[10px] font-medium text-primary">{t("chat.renameTip")}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <select
              value={preferredTranslation}
              onChange={(e) => {
                const v = e.target.value;
                setPreferredTranslation(v);
                try { localStorage.setItem("bibelbot-translation", v); } catch {}
              }}
              className="appearance-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer text-[10px] pr-4 pl-1 py-1 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30"
              title={t("chat.translationSelect", "Bibelübersetzung")}
            >
              <option value="auto">📖 Auto</option>
              <optgroup label="Deutsch">
                <option value="luther1912">Luther 1912</option>
                <option value="schlachter2000">Schlachter 2000</option>
                <option value="elberfelder">Elberfelder</option>
              </optgroup>
              <optgroup label="English">
                <option value="kjv">KJV</option>
                <option value="web">WEB</option>
              </optgroup>
            </select>
            <BookOpen className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={toggleSenior}
            className={`p-1.5 rounded-lg transition-colors ${isSenior ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label={t("chat.seniorMode")}
            title={t("chat.seniorMode")}
          >
            <Accessibility className={isSenior ? "h-5 w-5" : "h-4 w-4"} />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={t("chat.closeChat")}>
            <X className={isSenior ? "h-6 w-6" : "h-5 w-5"} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto ${s.padding} space-y-3`}>
        {!hasConversation && (
          <div className="space-y-4">
            {showWelcome && (
              <div className="animate-fade-up">
                <div className="flex justify-start">
                  <div className={`max-w-[85%] rounded-2xl rounded-bl-md ${s.msgPadding} ${s.text} leading-relaxed bg-muted text-foreground`}>
                    <div className={`prose ${isSenior ? "prose-lg" : "prose-sm"} max-w-none dark:prose-invert`}>
                      <ReactMarkdown>{welcomeMessage.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  {suggestions.map((sg, i) => (
                    <button key={sg} onClick={() => sendMessage(sg)} className={`text-left ${s.text} ${isSenior ? "px-5 py-4" : "px-4 py-2.5"} rounded-xl border border-primary/20 bg-accent/30 hover:bg-accent hover:border-primary/40 text-foreground transition-all duration-200 animate-fade-up`} style={{ animationDelay: `${(i + 1) * 150}ms`, opacity: 0 }}>{sg}</button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>{t("chat.shieldBadge")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div className={`rounded-2xl ${s.msgPadding} ${s.text} leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                {msg.role === "assistant" ? (
                  <div className={`prose ${isSenior ? "prose-lg" : "prose-sm"} max-w-none dark:prose-invert`}>
                    <ReactMarkdown components={{
                      p: ({ children }) => <p>{makeRefsClickable(children, sendMessage)}</p>,
                      li: ({ children }) => <li>{makeRefsClickable(children, sendMessage)}</li>,
                    }}>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mt-1">
                  {msg.qa && <QABadge qa={msg.qa} t={t} />}
                  <ShareButton
                    title={t("share.chatTitle")}
                    text={msg.content.length > 280 ? msg.content.slice(0, 277) + "…" : msg.content}
                    variant="icon"
                    className="ml-auto"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {showJourneyOffer && journeyDay === 0 && !isLoading && (
          <div className="animate-fade-up">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-primary/5 border border-primary/20 text-foreground">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{journeyOffer.content}</ReactMarkdown>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="text-xs h-7" onClick={() => { startJourney(); setJourneyDay(1); setShowJourneyOffer(false); track("journey_start", { day: 1 }); sendMessage(t("chat.journeyStartMsg")); }}>{t("chat.journeyStart")}</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" onClick={() => { setShowJourneyOffer(false); dismissJourney(); }}>{t("chat.journeyLater")}</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className={`bg-muted rounded-2xl rounded-bl-md ${s.msgPadding} flex items-center gap-2`}>
              <Loader2 className={`${s.btnIcon} animate-spin text-muted-foreground`} />
              <span className={`${s.textXs} text-muted-foreground`}>{t("chat.writing")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`border-t border-border ${isSenior ? "p-4" : "p-3"}`}>
        <div className="flex gap-2 items-end">
          <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("chat.placeholder")} className={`${isSenior ? "min-h-[56px] max-h-[120px] text-lg" : "min-h-[40px] max-h-[100px] text-sm"} resize-none`} rows={s.inputRows} />
          {SpeechRecognition && (
            <Button size="icon" variant={isListening ? "destructive" : "outline"} onClick={isListening ? stopListening : startListening} className={`${s.btnSize} shrink-0`} aria-label={isListening ? t("chat.stopVoice") : t("chat.startVoice")}>
              {isListening ? <MicOff className={s.btnIcon} /> : <Mic className={s.btnIcon} />}
            </Button>
          )}
          <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className={`${s.btnSize} shrink-0`}>
            <Send className={s.btnIcon} />
          </Button>
        </div>
      </div>
    </div>
  );
}
