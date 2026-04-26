import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { VoiceMode } from "@/components/VoiceMode";
import { VOICE_OPEN_EVENT } from "@/lib/chat-events";

const TEASER_KEY = "bibelbot-voice-teaser-shown";

export function VoiceFloatingButton() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(VOICE_OPEN_EVENT, handler);
    return () => window.removeEventListener(VOICE_OPEN_EVENT, handler);
  }, []);

  // First-time teaser bubble
  useEffect(() => {
    try {
      if (localStorage.getItem(TEASER_KEY)) return;
    } catch {}
    const t = setTimeout(() => {
      setShowTeaser(true);
      try { localStorage.setItem(TEASER_KEY, "1"); } catch {}
      // Auto-hide after 8s
      setTimeout(() => setShowTeaser(false), 8000);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // Get bot name from localStorage (same key as BibelBotChat)
  const botName = (() => {
    try { return localStorage.getItem("bibelbot-name") || "BibleBot"; }
    catch { return "BibleBot"; }
  })();

  return (
    <>
      <div className="fixed bottom-6 right-24 z-50 flex items-end gap-3">
        {showTeaser && (
          <div
            className="animate-in fade-in slide-in-from-right-4 duration-500 bg-card border border-primary/30 rounded-2xl rounded-br-md px-3 py-2 shadow-[0_4px_20px_hsl(var(--primary)/0.2)] max-w-[200px] cursor-pointer hover:shadow-[0_4px_28px_hsl(var(--primary)/0.3)] transition-shadow"
            onClick={() => { setShowTeaser(false); setOpen(true); }}
          >
            <p className="text-xs font-semibold text-foreground">Lieber reden statt tippen?</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live-Sprachgespräch starten</p>
          </div>
        )}
        <button
          onClick={() => { setShowTeaser(false); setOpen(true); }}
          className="relative h-14 w-14 rounded-full bg-secondary text-secondary-foreground shadow-[0_4px_20px_hsl(var(--secondary)/0.4)] hover:shadow-[0_4px_28px_hsl(var(--secondary)/0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
          aria-label="Voice-Gespräch starten"
          title="Voice-Gespräch mit BibleBot"
        >
          <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping" style={{ animationDuration: "3s" }} />
          <Phone className="h-6 w-6 relative z-10" />
        </button>
      </div>
      <VoiceMode open={open} onClose={() => setOpen(false)} botName={botName} />
    </>
  );
}
