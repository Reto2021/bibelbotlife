import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const BibelBotChat = lazy(() =>
  import("@/components/BibelBotChat").then((m) => ({ default: m.default || (m as any).BibelBotChat })),
);

/**
 * Schlanke Embed-Seite, optimiert für Iframe-Einbettung (embed.js).
 * Keine Navigation, kein Footer, voller Chat.
 */
export default function Embed() {
  const [params] = useSearchParams();
  const host = params.get("host") || "";
  const color = params.get("color") || "#C8883A";
  const name = params.get("name") || "BibelBot";

  useEffect(() => {
    // Apply primary color to CSS variable (HSL approximation)
    try {
      // Simple: just set a body data-attr; full HSL conversion lives in hexToHsl util
      document.documentElement.style.setProperty("--embed-primary", color);
    } catch {}

    // Track embed load
    try {
      const sid =
        sessionStorage.getItem("bb_embed_sid") ||
        (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem("bb_embed_sid", id);
          return id;
        })();
      supabase.from("analytics_events").insert({
        event_type: "event",
        event_name: "embed_widget_loaded",
        session_id: sid,
        event_data: { host, name },
        path: "/embed",
        referrer: document.referrer || null,
      } as any);
    } catch {}
  }, [host, color, name]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card"
        style={{ background: color, color: "#fff" }}
      >
        <div className="font-semibold text-sm truncate">{name}</div>
        <a
          href="https://biblebot.life"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] opacity-80 hover:opacity-100"
        >
          powered by biblebot.life
        </a>
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="p-6 text-muted-foreground">Lade…</div>}>
          <BibelBotChat />
        </Suspense>
      </div>
    </div>
  );
}
