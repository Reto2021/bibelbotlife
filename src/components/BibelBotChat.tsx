import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MessageCircle, Loader2, Mic, MicOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-chat`;

const SUGGESTIONS = [
  "Was sagt die Bibel über Hoffnung?",
  "Gib mir einen Tagesimpuls",
  "Hilf mir bei einem Gebet für einen schwierigen Tag",
];

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

export function BibelBotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [botName, setBotName] = useState(getBotName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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

  // Auto-open after 5s (once per session) + teaser bubble
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
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
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
          body: JSON.stringify({ messages: allMessages }),
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
            if (last?.role === "assistant") {
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
    [messages, isLoading, toast, botName]
  );

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
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-card border border-border rounded-2xl rounded-br-md px-4 py-3 shadow-lg max-w-[220px]">
            <p className="text-sm text-foreground font-medium">Hast du eine Frage zur Bibel? 📖</p>
            <p className="text-xs text-muted-foreground mt-1">Ich bin hier für dich.</p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center animate-bounce-gentle"
          aria-label="Chat öffnen"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
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
            <p className="text-xs text-muted-foreground">Dein Bibelbegleiter</p>
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
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground text-sm">
              Willkommen! Stelle mir eine Frage zur Bibel&nbsp;📖
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent text-accent-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
            placeholder="Stelle eine Frage..."
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
