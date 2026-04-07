import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MessageCircle, Loader2, Mic, MicOff, Pencil, Shield, Sparkles, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Global event for opening chat with a pre-filled message (used by DailyImpulse etc.)
const CHAT_OPEN_EVENT = "bibelbot-open-chat";

export function openBibelBotChat(message: string) {
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT, { detail: message }));
}

// Bible reference pattern for making citations clickable
const BIBLE_REF_PATTERN = /(\d\.\s?)?(?:Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Gen|Ex|Lev|Num|Dtn|Jos|Ri|Kön|Chr|Esr|Neh|Est|Ps|Spr|Pred|Hld|Jes|Jer|Klgl|Ez|Dan|Hos|Am|Ob|Jon|Mi|Nah|Hab|Zef|Hag|Sach|Mal|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Thess|Tim|Tit|Phlm|Hebr|Jak|Petr|Jud|Offb)\s+\d+(?:[,:]\d+(?:[\-–]\d+)?)?/g;

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

const SUGGESTIONS = [
  "Ich brauche gerade ein aufbauendes Wort",
  "Was sagt die Bibel, wenn man sich unsicher fühlt?",
  "Ich möchte herausfinden, was ich wirklich will",
];

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
    if (getJourneyDay() > 0) return false; // already started
    if (!isJourneyDismissed()) return false; // never dismissed = hasn't seen it yet or is seeing it
    const lastNudge = localStorage.getItem(JOURNEY_NUDGE_KEY);
    if (!lastNudge) return true;
    return Date.now() - parseInt(lastNudge, 10) > 3 * 24 * 60 * 60 * 1000; // every 3 days
  } catch { return false; }
}
function markNudgeShown() {
  try { localStorage.setItem(JOURNEY_NUDGE_KEY, Date.now().toString()); } catch {}
}

const DEFAULT_BOT_NAME = "BibelBot";
const STORAGE_KEY = "bibelbot-name";

function getBotName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BOT_NAME;
  } catch {
    return DEFAULT_BOT_NAME;
  }
}

function saveBotName(name: string) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {}
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
  try {
    if (!localStorage.getItem(JOURNEY_START_KEY)) {
      localStorage.setItem(JOURNEY_START_KEY, Date.now().toString());
    }
  } catch {}
}

function getCheckins(): Record<number, number> {
  try {
    const stored = localStorage.getItem(JOURNEY_CHECKINS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveCheckin(day: number, score: number) {
  try {
    const checkins = getCheckins();
    checkins[day] = score;
    localStorage.setItem(JOURNEY_CHECKINS_KEY, JSON.stringify(checkins));
  } catch {}
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Schön, dass du da bist 🤗\n\nIch bin dein BibelBot – dein persönlicher Begleiter mit der Bibel, guten Fragen und konkreten Impulsen. Kein Druck, keine Bewertung.\n\nDu kannst mich alles fragen – oder einfach erzählen, was dich gerade beschäftigt. 💛",
};

const JOURNEY_OFFER: Message = {
  role: "assistant",
  content:
    "💡 **Tipp:** Ich biete auch eine **21-Tage-Begleitung** an – 3 Wochen mit täglichen Impulsen, Reflexionen und konkreten Schritten. Ganz in deinem Tempo.\n\nMöchtest du das ausprobieren?",
};

// Check if text likely contains Bible citations
function likelyHasCitations(text: string): boolean {
  // Match patterns like "Johannes 3,16" or "Psalm 23" or "1. Mose 2,7" or "Mt 5,3-12"
  const pattern = /(\d\.\s?)?(Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Gen|Ex|Lev|Num|Dtn|Jos|Ri|Rut|Kön|Chr|Esr|Neh|Est|Ps|Spr|Pred|Hld|Jes|Jer|Klgl|Ez|Dan|Hos|Am|Ob|Jon|Mi|Nah|Hab|Zef|Hag|Sach|Mal|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Thess|Tim|Tit|Phlm|Hebr|Jak|Petr|Jud|Offb)\s+\d+/i;
  return pattern.test(text);
}

function QABadge({ qa }: { qa: QAResult | "loading" | "skipped" }) {
  if (qa === "loading") {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Zitate werden geprüft...</span>
      </div>
    );
  }

  if (qa === "skipped") return null;

  if (qa.citations_found === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 mt-2 text-xs cursor-help ${
              qa.has_issues ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {qa.has_issues ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            <span>
              {qa.has_issues
                ? `${qa.issues.length} Hinweis${qa.issues.length > 1 ? "e" : ""} zu Zitaten`
                : `${qa.citations_found} Zitat${qa.citations_found > 1 ? "e" : ""} geprüft ✓`}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] text-xs">
          {qa.has_issues ? (
            <div className="space-y-2">
              <p className="font-semibold">⚠️ Hinweise zur Genauigkeit:</p>
              {qa.issues.map((issue, i) => (
                <div key={i} className="border-t border-border pt-1.5">
                  <p className="font-medium">{issue.citation}</p>
                  <p className="text-muted-foreground">{issue.problem}</p>
                  {issue.correction && (
                    <p className="text-foreground mt-0.5">→ {issue.correction}</p>
                  )}
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

// Make Bible references clickable in chat messages
function makeRefsClickable(children: React.ReactNode, onRefClick: (msg: string) => void): React.ReactNode {
  if (!children) return children;
  
  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      const regex = new RegExp(BIBLE_REF_PATTERN.source, "g");
      let match;
      
      while ((match = regex.exec(node)) !== null) {
        if (match.index > lastIndex) {
          parts.push(node.slice(lastIndex, match.index));
        }
        const ref = match[0];
        parts.push(
          <button
            key={`ref-${match.index}`}
            onClick={(e) => {
              e.preventDefault();
              onRefClick(`Erkläre mir ${ref} im Detail: Was ist der historische Kontext? Wer spricht? Was kommt davor und danach? Und was bedeutet das für mich heute?`);
            }}
            className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer font-medium"
            title={`${ref} vertiefen`}
          >
            {ref}
          </button>
        );
        lastIndex = regex.lastIndex;
      }
      
      if (parts.length === 0) return node;
      if (lastIndex < node.length) parts.push(node.slice(lastIndex));
      return <>{parts}</>;
    }
    
    if (Array.isArray(node)) {
      return node.map((child, i) => <span key={i}>{processNode(child)}</span>);
    }
    
    return node;
  };
  
  if (Array.isArray(children)) {
    return children.map((child, i) => <span key={i}>{processNode(child)}</span>);
  }
  return processNode(children);
}

function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveMessages(msgs: Message[]) {
  try {
    const clean = msgs.map(({ qa, ...rest }) => ({
      ...rest,
      ...(qa && qa !== "loading" ? { qa } : {}),
    }));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(clean));
  } catch {}
}

export function BibelBotChat() {
  const [isOpen, setIsOpen] = useState(false);
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
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const runQA = useCallback(async (text: string, msgIndex: number) => {
    if (!likelyHasCitations(text)) {
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, qa: "skipped" } : m))
      );
      return;
    }

    setMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, qa: "loading" } : m))
    );

    try {
      const resp = await fetch(QA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!resp.ok) {
        setMessages((prev) =>
          prev.map((m, i) => (i === msgIndex ? { ...m, qa: "skipped" } : m))
        );
        return;
      }

      const qaResult: QAResult = await resp.json();
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, qa: qaResult } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, qa: "skipped" } : m))
      );
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast({
        title: "Nicht unterstützt",
        description: "Dein Browser unterstützt keine Spracheingabe.",
        variant: "destructive",
      });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "de-CH";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    const alreadyOpened = sessionStorage.getItem(AUTO_OPEN_KEY);
    if (alreadyOpened) return;

    const teaserTimer = setTimeout(() => setShowTeaser(true), 2000);
    const openTimer = setTimeout(() => {
      setIsOpen(true);
      setShowTeaser(false);
      sessionStorage.setItem(AUTO_OPEN_KEY, "1");
    }, 5000);

    return () => {
      clearTimeout(teaserTimer);
      clearTimeout(openTimer);
    };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showWelcome) {
      const timer = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, showWelcome]);

  // Show journey offer after first assistant reply (if not started/dismissed)
  useEffect(() => {
    if (
      messages.length >= 3 &&
      journeyDay === 0 &&
      !isJourneyDismissed() &&
      !showJourneyOffer
    ) {
      const timer = setTimeout(() => setShowJourneyOffer(true), 1500);
      return () => clearTimeout(timer);
    }
    // Nudge if dismissed but enough time passed
    if (
      messages.length >= 2 &&
      journeyDay === 0 &&
      shouldNudgeJourney() &&
      !showJourneyOffer
    ) {
      const timer = setTimeout(() => {
        setShowJourneyOffer(true);
        markNudgeShown();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, journeyDay, showJourneyOffer]);

  // Show rename tip after first reply if name is still default
  useEffect(() => {
    if (messages.length >= 2 && botName === DEFAULT_BOT_NAME && !showRenameTip) {
      const timer = setTimeout(() => setShowRenameTip(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, botName, showRenameTip]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showWelcome]);

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      setBotName(trimmed);
      saveBotName(trimmed);
    }
    setIsEditingName(false);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { role: "user", content: text.trim() };
      if (!journeyDay) {
        startJourney();
        setJourneyDay(1);
      }
      const contextMessages = messages.length === 0 ? [WELCOME_MESSAGE, userMsg] : [...messages, userMsg];
      setMessages(contextMessages);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: contextMessages, journeyDay: journeyDay || 1 }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          const errMsg =
            resp.status === 429
              ? "Zu viele Anfragen – bitte warte kurz."
              : resp.status === 402
                ? "KI-Kontingent erschöpft."
                : errData.error || "Fehler beim Verbinden.";
          toast({ title: "Fehler", description: errMsg, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        if (!resp.body) throw new Error("Kein Stream");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const upsert = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && prev.length > 1) {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
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

        // After streaming is complete, run QA on the assistant's response
        if (assistantSoFar) {
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (prev[lastIdx]?.role === "assistant") {
              runQA(assistantSoFar, lastIdx);
            }
            return prev;
          });
        }
      } catch (e) {
        console.error(e);
        toast({
          title: "Verbindungsfehler",
          description: `${botName} konnte nicht erreicht werden.`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, toast, botName, runQA]
  );

  // Listen for external open-chat events (from DailyImpulse etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as string;
      setIsOpen(true);
      setShowTeaser(false);
      setTimeout(() => sendMessage(msg), 300);
    };
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
        {showTeaser && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-card border border-border rounded-2xl rounded-br-md px-4 py-3 shadow-lg max-w-[240px]">
            <p className="text-sm text-foreground font-medium">
              Was beschäftigt dich gerade? 💛
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ich bin hier – ganz ohne Bewertung.
            </p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center animate-pulse-warm"
          aria-label="Chat öffnen"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    );
  }

  const hasConversation = messages.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[390px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-3rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-whatsapp border-2 border-card" />
          </div>
          <div>
            {isEditingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveName();
                }}
                className="flex items-center gap-1"
              >
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="h-6 text-sm w-28 px-1 py-0"
                  maxLength={20}
                  autoFocus
                  onBlur={handleSaveName}
                />
              </form>
            ) : (
              <button
                onClick={() => {
                  setNameDraft(botName);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1 group"
                title="Namen ändern"
              >
                <p className="font-semibold text-sm text-foreground">{botName}</p>
                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <p className="text-xs text-muted-foreground">
              {journeyDay > 0 && journeyDay <= 21
                ? `Tag ${journeyDay} von 21 · ${journeyDay <= 7 ? "Ankommen" : journeyDay <= 14 ? "Vertiefen" : "Handeln"}`
                : journeyDay > 21
                  ? "21 Tage geschafft! 🎉"
                  : "Dein persönlicher Begleiter"}
            </p>
            {journeyDay > 0 && (
              <div className="w-full bg-border rounded-full h-1 mt-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (journeyDay / 21) * 100)}%` }}
                />
              </div>
            )}
            {showRenameTip && botName === DEFAULT_BOT_NAME && (
              <div className="animate-fade-up mt-1 text-[10px] text-primary/70 flex items-center gap-1">
                <Info className="h-2.5 w-2.5" />
                <span>Tipp: Klick auf den Namen, um mich umzubenennen ✨</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Chat schliessen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!hasConversation && (
          <div className="space-y-4">
            {showWelcome && (
              <div className="animate-fade-up">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-muted text-foreground">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{WELCOME_MESSAGE.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-sm px-4 py-2.5 rounded-xl border border-primary/20 bg-accent/30 hover:bg-accent hover:border-primary/40 text-foreground transition-all duration-200 animate-fade-up"
                      style={{ animationDelay: `${(i + 1) * 150}ms`, opacity: 0 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Kein Login · Kein Urteil · Zitate geprüft</span>
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p>{makeRefsClickable(children, sendMessage)}</p>,
                        li: ({ children }) => <li>{makeRefsClickable(children, sendMessage)}</li>,
                      }}
                    >{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "assistant" && msg.qa && (
                <QABadge qa={msg.qa} />
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">schreibt...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schreib einfach drauflos..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          {SpeechRecognition && (
            <Button
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              onClick={isListening ? stopListening : startListening}
              className="h-10 w-10 shrink-0"
              aria-label={isListening ? "Aufnahme stoppen" : "Spracheingabe starten"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
