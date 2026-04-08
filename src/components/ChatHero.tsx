import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, ArrowRight, Shield, Loader2, Mic, MicOff, Send, Menu, LogIn, X, EyeOff, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrack } from "@/components/AnalyticsProvider";
import { openLifeWheel } from "@/components/LifeWheel";
import { CHAT_OPEN_EVENT, type ChatMode } from "@/lib/chat-events";
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

const DAILY_VERSES = [
  { quote: "«Kommt her zu mir, alle, die ihr mühselig und beladen seid; ich will euch erquicken.»", ref: "Matthäus 11,28" },
  { quote: "«Denn ich weiss wohl, was ich für Gedanken über euch habe, spricht der Herr: Gedanken des Friedens.»", ref: "Jeremia 29,11" },
  { quote: "«Fürchte dich nicht, denn ich bin bei dir; hab keine Angst, denn ich bin dein Gott.»", ref: "Jesaja 41,10" },
  { quote: "«Der Herr ist mein Hirte, mir wird nichts mangeln.»", ref: "Psalm 23,1" },
  { quote: "«Alle eure Sorge werft auf ihn; denn er sorgt für euch.»", ref: "1. Petrus 5,7" },
  { quote: "«Ich bin das Licht der Welt. Wer mir nachfolgt, wird nicht in der Finsternis wandeln.»", ref: "Johannes 8,12" },
  { quote: "«Seid stark und mutig! Fürchtet euch nicht, denn der Herr, euer Gott, ist mit euch.»", ref: "Josua 1,9" },
  { quote: "«Die auf den Herrn harren, kriegen neue Kraft, dass sie auffahren mit Flügeln wie Adler.»", ref: "Jesaja 40,31" },
  { quote: "«Denn wo zwei oder drei versammelt sind in meinem Namen, da bin ich mitten unter ihnen.»", ref: "Matthäus 18,20" },
  { quote: "«Schmecket und sehet, wie freundlich der Herr ist. Wohl dem, der auf ihn trauet!»", ref: "Psalm 34,9" },
  { quote: "«Er heilt, die zerbrochenen Herzens sind, und verbindet ihre Wunden.»", ref: "Psalm 147,3" },
  { quote: "«Die Liebe ist langmütig und freundlich. Sie erträgt alles, glaubt alles, hofft alles.»", ref: "1. Korinther 13,4–7" },
  { quote: "«Seid fröhlich in Hoffnung, geduldig in Trübsal, beharrlich im Gebet.»", ref: "Römer 12,12" },
  { quote: "«Vertraue auf den Herrn von ganzem Herzen und verlass dich nicht auf deinen Verstand.»", ref: "Sprüche 3,5" },
];

function getDailyVerse() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

type TopicChip = { emoji: string; key: string; special?: "lifewheel" | "sevenwhys" };

const TOPIC_CHIPS: TopicChip[] = [
  { emoji: "🤔", key: "namequiz" },
  { emoji: "🎡", key: "lifewheel", special: "lifewheel" },
  { emoji: "🔍", key: "sevenwhys", special: "sevenwhys" },
  { emoji: "🙏", key: "prayer" },
  { emoji: "💔", key: "heartbreak" },
  { emoji: "😰", key: "anxiety" },
  { emoji: "🌅", key: "newstart" },
  { emoji: "🙌", key: "gratitude" },
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
  { emoji: "🎊", key: "joy" },
  { emoji: "📖", key: "bibleverse" },
];

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function getSpeechLang(lang: string): string {
  const map: Record<string, string> = { de: "de-CH", en: "en-US", fr: "fr-FR", es: "es-ES" };
  return map[lang] || "de-CH";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-chat`;

const BIBLE_REF_PATTERN = /(\d\.\s?)?(?:Genesis|Exodus|Levitikus|Numeri|Deuteronomium|Josua|Richter|Rut|Samuel|Könige|Chronik|Esra|Nehemia|Ester|Hiob|Psalm|Psalmen|Sprüche|Prediger|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Korinther|Galater|Epheser|Philipper|Kolosser|Thessalonicher|Timotheus|Titus|Philemon|Hebräer|Jakobus|Petrus|Judas|Offenbarung|Mose|Mt|Mk|Lk|Joh|Apg|Röm|Kor|Gal|Eph|Phil|Kol|Ps|Spr|Jes|Jer)\s+\d+(?:[,:]\d+(?:[\-–]\d+)?)?/g;

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
          <button key={`ref-${match.index}`} onClick={(e) => { e.preventDefault(); onRefClick(`Erkläre mir ${ref} im Detail`); }} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary cursor-pointer font-medium">{ref}</button>
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
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);
  const { track } = useTrack();
  const { toast } = useToast();
  const { user } = useAuth();
  const { branding } = useChurchBranding();
  const dailyVerse = useMemo(() => getDailyVerse(), []);

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

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const upsert = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
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

        // Update the DB with final assistant content
        if (assistantSoFar && convId) {
          await updateLastAssistantMessage(convId, assistantSoFar);

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
    [messages, isLoading, toast, t, i18n.language, chatMode, track, createConversation, addMessage, updateLastAssistantMessage, updateTitle, setMessages, loadConversations]
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

      <section className="relative px-4 min-h-[calc(100vh-64px)] flex flex-col">
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
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                className="flex-1 flex flex-col justify-center py-8"
              >
                {/* Trust badge */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 text-center">
                  <span className="inline-flex items-center gap-3 text-sm font-semibold text-foreground bg-card/80 backdrop-blur-sm border border-border shadow-md px-5 py-2.5 rounded-full">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="flex items-center gap-2">
                       <span>{t("hero.badge.optionalLogin")}</span>
                      <span className="text-primary/40">·</span>
                      <EyeOff className="h-3.5 w-3.5 text-primary" />
                      <span>{t("hero.badge.noData")}</span>
                      <span className="text-primary/40">·</span>
                      <Heart className="h-3.5 w-3.5 text-primary" />
                      <span>{t("hero.badge.noJudgment")}</span>
                    </span>
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight text-center"
                >
                  {t("hero.title1")}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "var(--gradient-cta)" }}>
                    {t("hero.title2")}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-center"
                >
                  {t("chatHero.subtitle")}
                </motion.p>

                {/* Search input */}
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="relative max-w-2xl mx-auto mb-6 w-full"
                >
                  <div className={`relative flex items-center bg-card border-2 rounded-2xl shadow-lg transition-all duration-300 ${
                    isFocused ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]" : "border-border hover:border-primary/40"
                  }`}>
                    <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(e); } }}
                      placeholder={isFocused ? t("chatHero.focusPlaceholder") : placeholder + "│"}
                      className="w-full bg-transparent pl-12 pr-24 py-4 md:pl-14 md:py-5 text-base md:text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none rounded-2xl"
                      aria-label={t("chatHero.ariaLabel")}
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
                </motion.form>

                {/* Quick suggestions */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex flex-wrap justify-center gap-2 mb-6 max-w-2xl mx-auto">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} className="text-sm px-4 py-2 rounded-full border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all duration-200">
                      {s}
                    </button>
                  ))}
                </motion.div>

                {/* Topic chips */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="max-w-2xl mx-auto mb-6">
                  <p className="text-xs text-muted-foreground text-center mb-3">{t("tiles.sectionTitle")}</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {visibleChips.map((chip) => (
                      <button
                        key={chip.key}
                        onClick={() => handleChipClick(chip)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all duration-200"
                      >
                        <span>{chip.emoji}</span>
                        <span>{t(`tiles.${chip.key}.title`)}</span>
                      </button>
                    ))}
                    {!showMoreChips && (
                      <button onClick={() => setShowMoreChips(true)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-card/50 text-primary hover:bg-card transition-all duration-200">
                        +{TOPIC_CHIPS.length - 8} {t("tiles.showMore", "mehr")}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Bible quote */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="max-w-2xl mx-auto w-full">
                  <button
                    onClick={() => sendMessage(`Erkläre mir diesen Bibelvers im Detail: ${dailyVerse.quote} (${dailyVerse.ref}) – Wer hat das geschrieben? In welchem Kontext? Was bedeutet das für mein Leben heute?`)}
                    className="relative w-full bg-card/60 backdrop-blur-sm rounded-2xl px-8 py-6 border border-primary/10 text-center shadow-sm overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none group-hover:from-primary/[0.06] transition-all duration-300" />
                    <div className="relative">
                      <p className="text-foreground/80 italic text-base sm:text-lg leading-relaxed font-serif">{dailyVerse.quote}</p>
                      <p className="text-primary/60 text-sm mt-2 font-medium tracking-wide">– {dailyVerse.ref}</p>
                      <p className="text-xs text-muted-foreground mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t("impulse.deepDive", "Vers erkunden →")}</p>
                    </div>
                  </button>
                </motion.div>

                {/* Previous conversations hint */}
                {conversations.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center mt-6">
                    <button onClick={() => setSidebarOpen(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                      {t("chat.previousChats", { count: conversations.length, defaultValue: `${conversations.length} frühere Gespräche` })}
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
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[85%] md:max-w-[75%]">
                          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border text-foreground rounded-bl-md"
                          }`}>
                            {msg.role === "assistant" ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown components={{
                                  p: ({ children }) => <p>{makeRefsClickable(children, sendMessage)}</p>,
                                  li: ({ children }) => <li>{makeRefsClickable(children, sendMessage)}</li>,
                                }}>{msg.content}</ReactMarkdown>
                              </div>
                            ) : msg.content}
                          </div>
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-2 mt-1">
                              <ShareButton title={t("share.chatTitle")} text={msg.content.length > 280 ? msg.content.slice(0, 277) + "…" : msg.content} variant="icon" className="ml-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

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
                      className="min-h-[40px] max-h-[100px] text-sm resize-none"
                      rows={1}
                    />
                    {SpeechRecognition && (
                      <Button size="icon" variant={isListening ? "destructive" : "outline"} onClick={isListening ? stopListening : startListening} className="h-10 w-10 shrink-0">
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="h-10 w-10 shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => { startNewChat(); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
