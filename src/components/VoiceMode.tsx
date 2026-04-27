import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibelbot-chat`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const VOICE_ID = "onwK4e9ZLuTAKqWW03F9"; // Daniel – warm, gut für Deutsch

type Status = "idle" | "listening" | "thinking" | "speaking" | "error";
type Turn = { role: "user" | "assistant"; content: string };

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  botName: string;
}

// Web Speech API Typen (TS hat sie nicht von Haus aus)
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VoiceMode({ open, onClose, botName }: VoiceModeProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [partial, setPartial] = useState("");
  const [lastUser, setLastUser] = useState("");
  const [lastBot, setLastBot] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const historyRef = useRef<Turn[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const ttsPlayingRef = useRef(false);
  const stopFlagRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!getRecognitionCtor()) setSupported(false);
  }, []);

  const cleanup = () => {
    stopFlagRef.current = true;
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    } catch {}
    audioRef.current = null;
    ttsQueueRef.current = [];
    ttsPlayingRef.current = false;
    historyRef.current = [];
    setStatus("idle");
    setPartial("");
    setLastUser("");
    setLastBot("");
    setIsMuted(false);
  };

  useEffect(() => {
    if (!open) cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => cleanup(), []);

  // ---------- TTS ----------
  const playNextInQueue = async () => {
    if (ttsPlayingRef.current) return;
    const next = ttsQueueRef.current.shift();
    if (!next) return;
    ttsPlayingRef.current = true;
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: next, voiceId: VOICE_ID }),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.error("TTS failed:", resp.status, errText);
        throw new Error(`TTS ${resp.status}: ${errText.slice(0, 200)}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      (audio as any).playsInline = true;
      audio.setAttribute("playsinline", "true");
      await new Promise<void>((resolve) => {
        const done = () => {
          URL.revokeObjectURL(url);
          audio.removeEventListener("ended", done);
          audio.removeEventListener("error", done);
          resolve();
        };
        audio.addEventListener("ended", done);
        audio.addEventListener("error", done);
        audio.play().catch((err) => {
          console.warn("TTS play failed:", err);
          done();
        });
      });
    } catch (err) {
      console.warn("TTS error:", err);
    } finally {
      ttsPlayingRef.current = false;
      if (ttsQueueRef.current.length > 0 && !stopFlagRef.current) {
        void playNextInQueue();
      } else if (!stopFlagRef.current) {
        // Done speaking → resume listening
        setStatus("listening");
        setLastBot((prev) => prev); // keep
        startListening();
      }
    }
  };

  const enqueueTTS = (chunk: string) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;
    ttsQueueRef.current.push(trimmed);
    void playNextInQueue();
  };

  // ---------- Chat ----------
  const sendToBot = async (userText: string) => {
    setStatus("thinking");
    setLastUser(userText);
    setLastBot("");
    historyRef.current.push({ role: "user", content: userText });

    let assistantSoFar = "";
    let unsentBuffer = "";
    let firstChunk = true;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: historyRef.current,
          language: "de",
          mode: "voice",
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Chat ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (stopFlagRef.current) { reader.cancel(); break; }
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
            const content: string | undefined = parsed.choices?.[0]?.delta?.content;
            if (!content) continue;
            assistantSoFar += content;
            setLastBot(assistantSoFar);
            unsentBuffer += content;

            if (firstChunk) {
              setStatus("speaking");
              firstChunk = false;
            }

            // Sentence-boundary chunking → tiefere Latenz beim TTS
            const boundary = unsentBuffer.search(/[.!?…](\s|$)/);
            if (boundary >= 0) {
              const sentence = unsentBuffer.slice(0, boundary + 1);
              unsentBuffer = unsentBuffer.slice(boundary + 1).trimStart();
              enqueueTTS(stripMarkdown(sentence));
            }
          } catch {
            // ignore parse errors mid-chunk
          }
        }
      }

      // Rest abschicken
      if (unsentBuffer.trim()) {
        enqueueTTS(stripMarkdown(unsentBuffer));
      }
      historyRef.current.push({ role: "assistant", content: assistantSoFar });

      // Fallback: falls nichts gestreamt wurde
      if (!assistantSoFar) {
        setStatus("listening");
        startListening();
      }
    } catch (err) {
      console.error("Voice chat error:", err);
      toast({
        title: "Verbindung fehlgeschlagen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
        variant: "destructive",
      });
      setStatus("listening");
      startListening();
    }
  };

  // ---------- STT ----------
  const startListening = () => {
    if (stopFlagRef.current || isMuted) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    try { recognitionRef.current?.abort(); } catch {}
    const rec = new Ctor();
    rec.lang = "de-CH";
    rec.interimResults = true;
    rec.continuous = false;
    setPartial("");

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) setPartial(interim);
      if (final.trim()) {
        setPartial("");
        try { rec.stop(); } catch {}
        void sendToBot(final.trim());
      }
    };

    rec.onerror = (e: any) => {
      // 'no-speech' / 'aborted' kommen oft → einfach neu starten
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast({
          title: "Mikrofon blockiert",
          description: "Bitte Mikrofon-Zugriff erlauben.",
          variant: "destructive",
        });
        setStatus("error");
      }
    };

    rec.onend = () => {
      // Auto-restart wenn wir noch im listening-Modus sind
      if (!stopFlagRef.current && status === "listening" && !isMuted) {
        setTimeout(() => {
          if (!stopFlagRef.current && !isMuted) startListening();
        }, 250);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setStatus("listening");
    } catch (err) {
      console.warn("recognition start failed:", err);
    }
  };

  const start = async () => {
    stopFlagRef.current = false;
    historyRef.current = [];
    // Audio-Element auf User-Geste freischalten
    const audio = new Audio();
    (audio as any).playsInline = true;
    audio.setAttribute("playsinline", "true");
    audioRef.current = audio;

    // Begrüssung als ersten Bot-Turn (ohne Chat-Roundtrip)
    const greeting = `Hoi, ich bin ${botName}. Was beschäftigt dich gerade?`;
    setLastBot(greeting);
    historyRef.current.push({ role: "assistant", content: greeting });
    setStatus("speaking");
    enqueueTTS(greeting);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      try { recognitionRef.current?.abort(); } catch {}
    } else if (status === "listening") {
      startListening();
    }
  };

  if (!open) return null;

  const statusText = (() => {
    if (!supported) return "Dein Browser unterstützt leider keine Sprach­erkennung. Probier Chrome auf Android oder Desktop.";
    if (status === "idle") return "Tipp auf Start, dann reden wir.";
    if (status === "listening") return isMuted ? "Mikrofon stumm" : (partial || "Sprich jetzt – ich höre dir zu.");
    if (status === "thinking") return `${botName} denkt nach…`;
    if (status === "speaking") return lastBot || `${botName} spricht…`;
    if (status === "error") return "Etwas ist schiefgegangen. Bitte erneut versuchen.";
    return "";
  })();

  const orbActive = status === "speaking";

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Voice-Modus schliessen"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center text-center max-w-md w-full gap-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Voice-Gespräch mit {botName}
        </h2>

        <div className="relative h-48 w-48 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-primary/20 transition-transform duration-300 ${
              status !== "idle" ? "animate-pulse" : ""
            } ${orbActive ? "scale-110" : "scale-100"}`}
          />
          <div
            className={`absolute inset-4 rounded-full bg-primary/40 transition-transform duration-500 ${
              orbActive ? "scale-110" : "scale-95"
            }`}
          />
          <div
            className={`relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-[0_8px_40px_hsl(var(--primary)/0.5)] flex items-center justify-center transition-transform duration-200 ${
              orbActive ? "scale-110" : "scale-100"
            }`}
          >
            {status === "thinking" ? (
              <Loader2 className="h-10 w-10 text-primary-foreground animate-spin" />
            ) : status === "speaking" ? (
              <Volume2 className="h-10 w-10 text-primary-foreground" />
            ) : (
              <Mic className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
        </div>

        <div className="min-h-[4rem] w-full">
          {lastUser && status !== "idle" && (
            <p className="text-xs text-muted-foreground mb-2">Du: {lastUser}</p>
          )}
          <p className="text-foreground italic leading-relaxed line-clamp-5">
            {statusText}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {status === "idle" && supported && (
            <Button onClick={start} size="lg" className="rounded-full px-7">
              Voice starten
            </Button>
          )}

          {status !== "idle" && status !== "error" && (
            <Button
              variant={isMuted ? "secondary" : "outline"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full h-14 w-14 p-0"
              aria-label={isMuted ? "Mikrofon einschalten" : "Mikrofon stumm"}
              disabled={!supported}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}

          {status === "error" && (
            <Button onClick={start} size="lg">
              Erneut starten
            </Button>
          )}

          <Button
            variant="destructive"
            size="lg"
            onClick={onClose}
            className="rounded-full h-14 w-14 p-0"
            aria-label="Beenden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/70 max-w-xs">
          Spracherkennung läuft direkt im Browser, Antworten kommen vom gleichen Bot wie im Text-Chat. Kein Realtime-API – günstiger und natürlicher.
        </p>
      </div>
    </div>
  );
}

function stripMarkdown(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}
