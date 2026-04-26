import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SESSION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-session`;

type Status = "idle" | "connecting" | "connected" | "error";

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  botName: string;
}

export function VoiceMode({ open, onClose, botName }: VoiceModeProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const { toast } = useToast();

  const cleanup = () => {
    try { dcRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try {
      if (audioElRef.current) {
        audioElRef.current.srcObject = null;
        audioElRef.current.remove();
      }
    } catch {}
    audioElRef.current = null;
    pcRef.current = null;
    dcRef.current = null;
    localStreamRef.current = null;
    setStatus("idle");
    setIsAssistantSpeaking(false);
    setIsMuted(false);
    setAudioBlocked(false);
    setTranscript("");
  };

  const connect = async () => {
    if (status === "connecting" || status === "connected") return;
    setStatus("connecting");
    setAudioBlocked(false);
    try {
      // 1. Prime audio + microphone immediately from the user's tap.
      // Mobile WebViews often block playback if media setup happens later in an effect/async callback.
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.controls = false;
      audioEl.muted = true;
      audioEl.volume = 1;
      (audioEl as any).playsInline = true;
      audioEl.setAttribute("playsinline", "true");
      audioEl.style.position = "fixed";
      audioEl.style.width = "1px";
      audioEl.style.height = "1px";
      audioEl.style.opacity = "0";
      audioEl.style.pointerEvents = "none";
      audioEl.srcObject = new MediaStream();
      document.body.appendChild(audioEl);
      audioElRef.current = audioEl;
      audioEl.play().catch((err) => console.warn("audio unlock failed:", err));

      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      // 2. Get ephemeral token from our edge function
      const tokenResp = await fetch(SESSION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ voice: "alloy" }),
      });
      if (!tokenResp.ok) {
        const err = await tokenResp.json().catch(() => ({}));
        throw new Error(err.error || "Token-Anfrage fehlgeschlagen");
      }
      const session = await tokenResp.json();
      const ephemeralKey: string | undefined = session?.client_secret?.value;
      if (!ephemeralKey) throw new Error("Kein Token erhalten");

      // 3. Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        const remoteStream = ev.streams[0] ?? new MediaStream([ev.track]);
        audioEl.srcObject = remoteStream;
        audioEl.muted = false;
        audioEl.volume = 1;
        audioEl.play().catch((err) => {
          console.warn("audio.play() failed:", err);
          setAudioBlocked(true);
        });
      };

      // 4. Local mic
      const stream = await streamPromise;
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 5. Data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("open", () => {
        // Kick off with a brief greeting so the user immediately hears the bot.
        try {
          dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio", "text"],
                instructions:
                  "Begrüsse den Menschen kurz und herzlich auf Schweizer Hochdeutsch (ein bis zwei Sätze) und frag offen, was ihn gerade beschäftigt.",
              },
            }),
          );
        } catch (err) {
          console.warn("greeting send failed", err);
        }
      });
      dc.addEventListener("message", (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "response.audio.delta" || msg.type === "response.output_audio.delta") {
            setIsAssistantSpeaking(true);
          } else if (
            msg.type === "response.done" ||
            msg.type === "response.audio.done" ||
            msg.type === "response.output_audio.done"
          ) {
            setIsAssistantSpeaking(false);
          } else if (msg.type === "response.audio_transcript.delta") {
            setTranscript((prev) => prev + (msg.delta ?? ""));
          } else if (msg.type === "response.audio_transcript.done") {
            // Reset transcript a moment later for next turn
            setTimeout(() => setTranscript(""), 4000);
          } else if (msg.type === "input_audio_buffer.speech_started") {
            // user started speaking → barge-in
            setIsAssistantSpeaking(false);
          } else if (msg.type === "error") {
            throw new Error(msg.error?.message || "Realtime-Fehler");
          }
        } catch (err) {
          console.warn("Realtime event error:", err);
        }
      });

      // 6. SDP offer/answer with OpenAI Realtime
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResp = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );
      if (!sdpResp.ok) {
        const txt = await sdpResp.text();
        throw new Error(`OpenAI SDP-Antwort fehlgeschlagen: ${txt}`);
      }
      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setStatus("connected");
    } catch (e) {
      console.error("Voice connect error:", e);
      toast({
        title: "Voice-Verbindung fehlgeschlagen",
        description: e instanceof Error ? e.message : "Unbekannter Fehler",
        variant: "destructive",
      });
      cleanup();
      setStatus("error");
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !isMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    setIsMuted(newMuted);
  };

  // Reset when closed. Connection starts only from the visible Start button,
  // so microphone + audio playback stay tied to a real user gesture.
  useEffect(() => {
    if (!open) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  if (!open) return null;

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

        {/* Visual orb */}
        <div className="relative h-48 w-48 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-primary/20 transition-transform duration-300 ${
              status === "connected" ? "animate-pulse" : ""
            } ${isAssistantSpeaking ? "scale-110" : "scale-100"}`}
          />
          <div
            className={`absolute inset-4 rounded-full bg-primary/40 transition-transform duration-500 ${
              isAssistantSpeaking ? "scale-110" : "scale-95"
            }`}
          />
          <div
            className={`relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-[0_8px_40px_hsl(var(--primary)/0.5)] flex items-center justify-center transition-transform duration-200 ${
              isAssistantSpeaking ? "scale-110" : "scale-100"
            }`}
          >
            {status === "connecting" ? (
              <Loader2 className="h-10 w-10 text-primary-foreground animate-spin" />
            ) : isAssistantSpeaking ? (
              <Volume2 className="h-10 w-10 text-primary-foreground" />
            ) : (
              <Mic className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="min-h-[3rem]">
          {status === "idle" && (
            <p className="text-muted-foreground">
              Tippe auf Start, dann kann dein Handy Mikrofon und Ton freigeben.
            </p>
          )}
          {status === "connecting" && (
            <p className="text-muted-foreground">Verbindung wird aufgebaut…</p>
          )}
          {status === "connected" && !isAssistantSpeaking && !transcript && (
            <p className="text-muted-foreground">
              {isMuted ? "Mikrofon stumm" : "Sprich jetzt – ich höre dir zu."}
            </p>
          )}
          {status === "connected" && (isAssistantSpeaking || transcript) && (
            <p className="text-foreground italic leading-relaxed line-clamp-4">
              {transcript || `${botName} spricht…`}
            </p>
          )}
          {status === "error" && (
            <p className="text-destructive">
              Verbindung fehlgeschlagen. Bitte erneut versuchen.
            </p>
          )}
          {audioBlocked && status === "connected" && (
            <p className="text-xs text-destructive mt-2">
              Ton wurde vom Browser blockiert. Tippe unten auf „Ton aktivieren“.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {status === "idle" && (
            <Button onClick={connect} size="lg" className="rounded-full px-7">
              Voice starten
            </Button>
          )}

          {status === "connected" && (
            <Button
              variant={isMuted ? "secondary" : "outline"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full h-14 w-14 p-0"
              aria-label={isMuted ? "Mikrofon einschalten" : "Mikrofon stumm"}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}

          {audioBlocked && status === "connected" && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const audio = audioElRef.current;
                if (!audio) return;
                audio.muted = false;
                audio.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
              }}
              className="rounded-full px-5"
            >
              Ton aktivieren
            </Button>
          )}

          {status === "error" && (
            <Button onClick={connect} size="lg">
              Erneut verbinden
            </Button>
          )}

          <Button
            variant="destructive"
            size="lg"
            onClick={onClose}
            className="rounded-full px-6"
          >
            Beenden
          </Button>
        </div>

        <p className="text-xs text-muted-foreground max-w-xs">
          Dein Gespräch wird nicht gespeichert. Audio wird live verarbeitet und
          danach verworfen.
        </p>
      </div>
    </div>
  );
}
