import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, X, MessageCircle, Loader2, Mic, MicOff, Pencil, Shield, Sparkles, CheckCircle2, AlertTriangle, Info, BookOpen, Volume2, VolumeX, ChevronDown, Heart, Phone } from "lucide-react";
import { useTTS } from "@/hooks/use-tts";
import { VoiceMode } from "@/components/VoiceMode";

import { ShareButton } from "@/components/ShareButton";
import { ChatFeedbackButtons } from "@/components/ChatFeedbackButtons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useTrack } from "@/components/AnalyticsProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`;

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
const DONATED_AT_KEY = "bibelbot-donated-at";
const DONATE_DISMISS_KEY = "bibelbot-donate-dismissed";
const DONATE_GRACE_DAYS = 30;

function hasDonatedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DONATED_AT_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < DONATE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

function isDonateNudgeDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DONATE_DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < 7 * 24 * 60 * 60 * 1000; // 7 days
  } catch { return false; }
}

function dismissDonateNudge() {
  try { localStorage.setItem(DONATE_DISMISS_KEY, Date.now().toString()); } catch {}
}

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
      <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{t("chat.qaChecking")}</span>
      </div>
    );
  }
  if (qa === "skipped") return null;
  if (qa.citations_found === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={`flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-sm font-medium text-left w-full sm:w-auto hover:opacity-90 transition-opacity ${qa.has_issues ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"}`}>
          {qa.has_issues ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>
            {qa.has_issues
              ? t("chat.qaIssue", { count: qa.issues.length })
              : t("chat.qaOk", { count: qa.citations_found })}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-[320px] text-xs">
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
      </PopoverContent>
    </Popover>
  );
}

function makeRefsClickable(children: React.ReactNode, onRefClick: (msg: string) => void, t: (key: string, opts?: any) => string): React.ReactNode {
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
          <button key={`ref-${match.index}`} onClick={(e) => { e.preventDefault(); onRefClick(t("toolPrompts.explainRef", { ref })); }} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer font-medium" title={ref}>{ref}</button>
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

/** Extract options like "a) …", "b) …", "A) …", "1. …", "- **…**" from assistant text */
function extractOptions(text: string): { cleanText: string; options: string[] } {
  // Strategy: try multiple patterns and return the first that yields ≥2 options

  // --- 1. Line-start patterns (each option on its own line) ---
  const linePatterns: { line: RegExp; strip: RegExp }[] = [
    { line: /^(\*{0,2})[a-z]\)\1\s+.+$/gm, strip: /^(\*{0,2})[a-z]\)\1\s+/ },
    { line: /^(\*{0,2})[A-Z]\)\1\s+.+$/gm, strip: /^(\*{0,2})[A-Z]\)\1\s+/ },
    { line: /^(\*{0,2})\d+\.\1\s+.+$/gm, strip: /^(\*{0,2})\d+\.\1\s+/ },
    { line: /^[-–•]\s+.+$/gm, strip: /^[-–•]\s+/ },
  ];

  for (const { line, strip } of linePatterns) {
    line.lastIndex = 0;
    const matches = text.match(line);
    if (matches && matches.length >= 2) {
      let cleanText = text;
      for (const m of matches) cleanText = cleanText.replace(m, "");
      cleanText = cleanText.replace(/\n{3,}/g, "\n\n").trim();
      const options = matches.map((m) =>
        m.replace(strip, "").replace(/\*{1,2}/g, "").trim()
      );
      if (options.every((o) => o.length > 2)) return { cleanText, options };
    }
  }

  // --- 2. Inline / mixed: a) … b) … c) … anywhere in text (even mid-paragraph or across lines) ---
  // Flatten to single line for robust matching
  const flat = text.replace(/\n/g, " ").replace(/\s{2,}/g, " ");
  const inlineRe = /\*{0,2}[a-zA-Z]\)\*{0,2}\s/g;
  const inlineMatches = flat.match(inlineRe);
  if (inlineMatches && inlineMatches.length >= 2) {
    const firstIdx = flat.search(inlineRe);
    if (firstIdx >= 0) {
      const beforeOptions = flat.slice(0, firstIdx).trim();
      const optionsText = flat.slice(firstIdx);
      // Split on each letter-paren marker
      const splitRe = /\*{0,2}[a-zA-Z]\)\*{0,2}\s+/g;
      const parts = optionsText.split(splitRe).filter((s) => s.trim().length > 2);
      const options = parts.map((p) => p.replace(/\*{1,2}/g, "").replace(/[.?!,;]\s*$/, "").trim());
      if (options.length >= 2) return { cleanText: beforeOptions, options };
    }
  }

  // --- 3. Numbered inline: 1) … 2) … 3) … ---
  const numInlineRe = /\*{0,2}\d+\)\*{0,2}\s/g;
  const numMatches = flat.match(numInlineRe);
  if (numMatches && numMatches.length >= 2) {
    const firstIdx = flat.search(numInlineRe);
    if (firstIdx >= 0) {
      const beforeOptions = flat.slice(0, firstIdx).trim();
      const optionsText = flat.slice(firstIdx);
      const splitRe = /\*{0,2}\d+\)\*{0,2}\s+/g;
      const parts = optionsText.split(splitRe).filter((s) => s.trim().length > 2);
      const options = parts.map((p) => p.replace(/\*{1,2}/g, "").replace(/[.?!,;]\s*$/, "").trim());
      if (options.length >= 2) return { cleanText: beforeOptions, options };
    }
  }

  return { cleanText: text, options: [] };
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

export function BibleBotChat() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [showTeaser, setShowTeaser] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [journeyDay, setJourneyDay] = useState(getJourneyDay);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [botName, setBotName] = useState(getBotName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showJourneyOffer, setShowJourneyOffer] = useState(false);
  const [showRenameTip, setShowRenameTip] = useState(false);
  const [preferredTranslation, setPreferredTranslation] = useState(() => {
    try { return localStorage.getItem("bibelbot-translation") || "auto"; } catch { return "auto"; }
  });
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const tts = useTTS();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { track } = useTrack();

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

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        if (audioBlob.size < 1000) { setIsListening(false); return; }
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("language", i18n.language);
          const resp = await fetch(STT_URL, {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.text?.trim()) setInput(data.text.trim());
          } else {
            toast({ title: t("chat.errorTitle"), description: t("chat.noVoice"), variant: "destructive" });
          }
        } catch {
          toast({ title: t("chat.errorTitle"), description: t("chat.noVoice"), variant: "destructive" });
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      setIsListening(true);
    } catch {
      toast({ title: t("subscribe.toastNotSupported"), description: t("chat.noVoice"), variant: "destructive" });
    }
  }, [toast, t, i18n.language]);

  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    setIsListening(false);
    setRecordingSeconds(0);
  }, []);

  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem(AUTO_OPEN_KEY);
    if (alreadyOpened) return;

    const isFirstEverVisit = !localStorage.getItem("bibelbot-visited");
    if (isFirstEverVisit) {
      localStorage.setItem("bibelbot-visited", "1");
    }

    const teaserDelay = isFirstEverVisit ? 2000 : 5000;

    const teaserTimer = setTimeout(() => {
      setShowTeaser(true);
      sessionStorage.setItem(AUTO_OPEN_KEY, "1");
    }, teaserDelay);
    return () => { clearTimeout(teaserTimer); };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showWelcome) {
      const timer = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, showWelcome]);

  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant").length;
    if (assistantMessages >= 2 && getJourneyDay() === 0 && !showJourneyOffer && !isJourneyDismissed()) {
      const timer = setTimeout(() => setShowJourneyOffer(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [messages, showJourneyOffer]);

  useEffect(() => {
    if (messages.length >= 2 && botName === DEFAULT_BOT_NAME && !showRenameTip) {
      const timer = setTimeout(() => setShowRenameTip(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, botName, showRenameTip]);

  useEffect(() => { if (messages.length > 0) saveMessages(messages); }, [messages]);
  useEffect(() => { if (isOpen) setShowTeaser(false); }, [isOpen]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) el.scrollTop = el.scrollHeight;
  }, [messages, showWelcome]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(distFromBottom > 120);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

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
          body: JSON.stringify({ messages: contextMessages, language: i18n.language, mode: chatMode, preferredTranslation: preferredTranslation !== "auto" ? preferredTranslation : undefined, screenWidth: window.innerWidth }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          const errMsg = resp.status === 429 ? t("chat.errorTooMany") : resp.status === 402 ? t("chat.errorCredits") : errData.error || t("chat.errorConnect");
          toast({ title: t("chat.errorTitle"), description: errMsg, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error(t("chat.errorNoStream"));

        const upsertChunk = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && prev.length > 1) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

        // Use streaming if supported, otherwise fall back to reading the full body
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
          // Fallback: re-fetch without streaming for Safari/iOS
          console.warn("Stream read failed, using fallback:", streamErr);
          const fallbackResp = await fetch(CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ messages: contextMessages, language: i18n.language, mode: chatMode, preferredTranslation: preferredTranslation !== "auto" ? preferredTranslation : undefined, screenWidth: window.innerWidth }),
          });
          const fullText = await fallbackResp.text();
          const lines = fullText.split("\n");
          for (const line of lines) {
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

        // Run QA check after streaming is complete
        if (assistantSoFar) {
          // Use a microtask to ensure state has settled, then find the correct index
          queueMicrotask(() => {
            setMessages((prev) => {
              let lastAssistantIdx = -1;
              for (let i = prev.length - 1; i >= 0; i--) { if (prev[i].role === "assistant") { lastAssistantIdx = i; break; } }
              if (lastAssistantIdx >= 0 && !prev[lastAssistantIdx].qa) {
                setTimeout(() => runQA(prev[lastAssistantIdx].content, lastAssistantIdx), 0);
              }
              return prev;
            });
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
            <p className={`text-sm text-foreground font-semibold`}>{t("chat.teaser")}</p>
            <p className={`text-xs text-muted-foreground mt-1`}>{t("chat.teaserSub")}</p>
            <p className={`text-xs text-primary font-medium mt-2 flex items-center gap-1`}>
              <MessageCircle className="h-3 w-3" />
              {t("chat.teaserCta")}
            </p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className={`relative h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_28px_hsl(var(--primary)/0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center`}
          aria-label={t("chat.openChat")}
        >
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2.5s" }} />
          <MessageCircle className={`h-7 w-7 relative z-10`} />
        </button>
      </div>
    );
  }

  const hasConversation = messages.length > 0;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden relative`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5`}>
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
                ? t("chat.journeyProgress", { day: journeyDay, total: 21, phase: journeyDay <= 7 ? t("chat.arriving") : journeyDay <= 14 ? t("chat.deepening") : t("chat.acting") })
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
                <option value="luther">{t("chat.translationLuther", "Lutherbibel")}</option>
                <option value="elberfelder">{t("chat.translationElberfelder", "Elberfelder – Wortgetreu")}</option>
                <option value="schlachter2000">{t("chat.translationSchlachter", "Schlachter – Freikirchlich")}</option>
              </optgroup>
              <optgroup label="English">
                <option value="bsb">Berean Standard Bible</option>
                <option value="kjv">King James Version</option>
                <option value="web">World English Bible</option>
              </optgroup>
            </select>
            <BookOpen className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
          
          <button
            onClick={() => setVoiceModeOpen(true)}
            className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
            aria-label="Voice-Gespräch starten"
            title="Voice-Gespräch starten"
          >
            <Phone className="h-4 w-4" />
          </button>

          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={t("chat.closeChat")}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <VoiceMode open={voiceModeOpen} onClose={() => setVoiceModeOpen(false)} botName={botName} />

      {/* Messages */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto px-4 py-3 space-y-3`}>
        {!hasConversation && (
          <div className="space-y-4">
            {showWelcome && (
              <div className="animate-fade-up">
                <div className="flex justify-start">
                  <div className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-base leading-relaxed bg-muted text-foreground`}>
                    <div className={`prose prose-sm max-w-none dark:prose-invert font-serif`}>
                      <ReactMarkdown>{welcomeMessage.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  {suggestions.map((sg, i) => (
                    <button key={sg} onClick={() => sendMessage(sg)} className={`text-left text-base px-4 py-3 rounded-xl border border-primary/20 bg-accent/30 hover:bg-accent hover:border-primary/40 text-foreground transition-all duration-200 animate-fade-up`} style={{ animationDelay: `${(i + 1) * 150}ms`, opacity: 0 }}>{sg}</button>
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

        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const { cleanText, options } = msg.role === "assistant" ? extractOptions(msg.content) : { cleanText: msg.content, options: [] };
          // Count assistant messages up to this point
          const assistantIndex = msg.role === "assistant"
            ? messages.slice(0, i + 1).filter(m => m.role === "assistant").length
            : 0;
          const showDonateNudge = msg.role === "assistant" && isLast && assistantIndex >= 3 && assistantIndex % 3 === 0;
          const donated = hasDonatedRecently();
          const nudgeDismissed = isDonateNudgeDismissed();
          return (
          <div key={i}>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div className={`rounded-2xl px-4 py-3 text-base leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert font-serif">
                    <ReactMarkdown components={{
                      p: ({ children }) => <p>{makeRefsClickable(children, sendMessage, t)}</p>,
                      li: ({ children }) => <li>{makeRefsClickable(children, sendMessage, t)}</li>,
                    }}>{cleanText}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {/* Option buttons */}
              {msg.role === "assistant" && options.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {options.map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => sendMessage(opt)}
                      className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-primary/20 bg-accent/30 hover:bg-accent hover:border-primary/40 text-foreground transition-all duration-200"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mt-1.5">
                  {msg.qa && <QABadge qa={msg.qa} t={t} />}
                  <button
                    onClick={() => tts.play(msg.content)}
                    disabled={tts.isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label={tts.isPlaying ? t("chat.stopAudio", "Stoppen") : t("chat.playAudio", "Vorlesen")}
                    title={tts.isPlaying ? t("chat.stopAudio", "Stoppen") : t("chat.playAudio", "Vorlesen")}
                  >
                    {tts.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : tts.isPlaying ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    <span className="text-xs">{tts.isPlaying ? t("chat.stopAudio", "Stopp") : t("chat.playAudio", "Vorlesen")}</span>
                  </button>
                  <ShareButton
                    title={t("share.chatTitle")}
                    text={msg.content.length > 280 ? msg.content.slice(0, 277) + "…" : msg.content}
                    variant="icon"
                    className="ml-auto"
                  />
                </div>
              )}
              {msg.role === "assistant" && i > 0 && (
                <div className="mt-1.5">
                  <ChatFeedbackButtons
                    questionText={[...messages.slice(0, i)].reverse().find((m) => m.role === "user")?.content || ""}
                    answerText={msg.content}
                    language={i18n.language || "de"}
                  />
                </div>
              )}
            </div>
            </div>
            {/* Subtle donation nudge */}
            {showDonateNudge && !nudgeDismissed && (
              <div className="flex justify-center mt-2 mb-1 animate-fade-up">
                {donated ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-primary/70 bg-primary/5 border border-primary/10 rounded-full px-3 py-1">
                    <Heart className="h-3 w-3 fill-primary/50 text-primary/50" />
                    {t("chat.donorBadge", "Danke für deine Unterstützung! ❤️")}
                  </span>
                ) : (
                  <a
                    href="/spenden"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary bg-muted/50 hover:bg-primary/5 border border-transparent hover:border-primary/15 rounded-full px-3 py-1 transition-all"
                    onClick={() => { track("donate_nudge_click", {}); }}
                  >
                    <Heart className="h-3 w-3 group-hover:text-primary transition-colors" />
                    {t("chat.donateNudge", "Gefällt dir BibleBot? Hilf uns mit einer kleinen Spende 🙏")}
                    <button
                      className="ml-1 text-muted-foreground/50 hover:text-muted-foreground text-[10px]"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissDonateNudge(); }}
                      aria-label={t("chat.close", "Schliessen")}
                    >
                      ✕
                    </button>
                  </a>
                )}
              </div>
            )}
          </div>
          );
        })}

        {showJourneyOffer && (
          <div className="flex justify-start animate-fade-up">
            <div className="max-w-[85%]">
              <div className="rounded-2xl rounded-bl-md px-4 py-3 text-base leading-relaxed bg-primary/10 border border-primary/20 text-foreground">
                <div className="prose prose-sm max-w-none dark:prose-invert font-serif">
                  <ReactMarkdown>{journeyOffer.content}</ReactMarkdown>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { startJourney(); setJourneyDay(1); setShowJourneyOffer(false); sendMessage(t("chat.journeyStart", "Ja, ich möchte die 21-Tage-Begleitung starten!")); }}
                  className="text-sm px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-all"
                >
                  {t("chat.journeyYes", "Ja, gerne!")}
                </button>
                <button
                  onClick={() => { dismissJourney(); setShowJourneyOffer(false); }}
                  className="text-sm px-3.5 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all"
                >
                  {t("chat.journeyNo", "Vielleicht später")}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className={`bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1`}>
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollDown && (
        <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; setShowScrollDown(false); }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            {t("chat.scrollDown", "Neueste")}
          </button>
        </div>
      )}

      {/* Input */}
      <div className={`border-t border-border p-3`}>
        <div className="flex gap-2 items-end">
          <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("chat.placeholder")} className={`min-h-[40px] max-h-[100px] text-base resize-none`} rows={1} />
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <Button
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              onClick={isListening ? stopListening : startListening}
              disabled={isTranscribing}
              className={`h-10 w-10 relative`}
              aria-label={isListening ? t("chat.stopVoice") : t("chat.startVoice")}
              title={isListening ? t("chat.stopVoice") : t("chat.startVoice", "Spracheingabe")}
            >
              {isTranscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isListening && <span className="absolute inset-0 rounded-md border-2 border-destructive animate-pulse" />}
            </Button>
            {isListening && (
              <span className="text-[10px] font-mono text-destructive leading-none tabular-nums">
                {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}
              </span>
            )}
          </div>
          <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className={`h-10 w-10 shrink-0`} title={t("chat.send", "Senden")}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
