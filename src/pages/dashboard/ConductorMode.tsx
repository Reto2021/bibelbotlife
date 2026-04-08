import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize, Clock, X } from "lucide-react";
import { Music, BookOpen, Mic, HandHeart, Cross, Church, FileText, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { BlockType, ServiceBlockData } from "@/components/services/ServiceBlock";

const BLOCK_ICONS: Record<string, React.ElementType> = {
  song: Music, reading: BookOpen, sermon: Mic, prayer: HandHeart,
  blessing: Cross, communion: Church, liturgy: FileText,
  announcement: Megaphone, free: FileText, music: Music,
};

const BLOCK_LABELS: Record<string, string> = {
  song: "Lied", reading: "Lesung", sermon: "Predigt", prayer: "Gebet",
  blessing: "Segen", communion: "Abendmahl", liturgy: "Liturgie",
  announcement: "Ansage", free: "Frei", music: "Musik",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ConductorMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<any>(null);
  const [blocks, setBlocks] = useState<ServiceBlockData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blockElapsed, setBlockElapsed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load service
  useEffect(() => {
    if (!id || !user) return;
    supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setService(data);
          setBlocks((data.blocks as ServiceBlockData[]) || []);
        }
      });
  }, [id, user]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
      setBlockElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    setBlockElapsed(0);
  }, []);

  const prev = () => goTo(Math.max(0, currentIndex - 1));
  const next = () => goTo(Math.min(blocks.length - 1, currentIndex + 1));

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
        else navigate(-1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, blocks.length]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const currentBlock = blocks[currentIndex];
  const nextBlock = blocks[currentIndex + 1];

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Gottesdienst wird geladen...
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <p>Dieser Gottesdienst hat keine Blöcke.</p>
        <Button variant="outline" onClick={() => navigate(`/dashboard/editor/${id}`)}>
          Im Editor öffnen
        </Button>
      </div>
    );
  }

  const Icon = BLOCK_ICONS[currentBlock?.type] || FileText;
  const NextIcon = nextBlock ? (BLOCK_ICONS[nextBlock.type] || FileText) : null;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-background text-foreground ${
        isFullscreen ? "fixed inset-0 z-[100]" : "min-h-[calc(100vh-4rem)]"
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">{service.title}</h1>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} / {blocks.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(elapsed)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRunning((r) => !r)}
            className={isRunning ? "text-green-500" : "text-muted-foreground"}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          {isFullscreen && (
            <Button variant="ghost" size="icon" onClick={() => document.exitFullscreen()}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main teleprompter area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-auto">
        {/* Block type badge */}
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            {BLOCK_LABELS[currentBlock.type] || currentBlock.type}
          </span>
          {currentBlock.duration && (
            <span className="text-xs text-muted-foreground ml-2">
              ~{currentBlock.duration} Min. | {formatTime(blockElapsed)}
            </span>
          )}
        </div>

        {/* Title */}
        {currentBlock.title && (
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 max-w-4xl leading-tight">
            {currentBlock.title}
          </h2>
        )}

        {/* Content */}
        {currentBlock.content && (
          <div className="text-xl sm:text-2xl lg:text-3xl leading-relaxed text-center max-w-3xl whitespace-pre-wrap text-foreground/90">
            {currentBlock.content}
          </div>
        )}
      </div>

      {/* Next block preview */}
      {nextBlock && (
        <div className="px-6 pb-2 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            Nächstes: {NextIcon && <span className="inline-flex"><NextIcon className="h-3 w-3" /></span>}
            <span className="font-medium">{BLOCK_LABELS[nextBlock.type]}</span>
            {nextBlock.title && <span>— {nextBlock.title}</span>}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card shrink-0">
        <Button variant="outline" onClick={prev} disabled={currentIndex === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Zurück
        </Button>

        {/* Mini block map */}
        <div className="hidden sm:flex items-center gap-1 overflow-auto max-w-[50vw]">
          {blocks.map((b, i) => {
            const BIcon = BLOCK_ICONS[b.type] || FileText;
            return (
              <button
                key={b.id}
                onClick={() => goTo(i)}
                className={`p-1.5 rounded transition-colors ${
                  i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : i < currentIndex
                    ? "bg-muted text-muted-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted"
                }`}
                title={`${BLOCK_LABELS[b.type]}${b.title ? `: ${b.title}` : ""}`}
              >
                <BIcon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <Button variant="outline" onClick={next} disabled={currentIndex === blocks.length - 1} className="gap-1">
          Weiter <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
