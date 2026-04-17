import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, MessageCircle, Music, BookOpen, Mic, HandHeart, Cross, Church, Megaphone, FileText, ChevronDown, ChevronUp, Library, Link2, ExternalLink, Target, Sparkles, Users, ClipboardList, MessagesSquare, Lightbulb, House, Video, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { ResourceSuggest } from "./ResourceSuggest";
import type { Resource } from "@/hooks/use-resources";

export type BlockType =
  | "song" | "reading" | "sermon" | "prayer" | "blessing" | "communion" | "liturgy" | "announcement" | "free" | "music"
  // Lesson blocks
  | "lesson_objective" | "warmup" | "input" | "activity" | "worksheet" | "discussion" | "reflection" | "homework" | "video" | "image";

export interface ServiceBlockData {
  id: string;
  type: BlockType;
  title: string;
  content: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

const BLOCK_ICONS: Record<BlockType, React.ElementType> = {
  song: Music,
  reading: BookOpen,
  sermon: Mic,
  prayer: HandHeart,
  blessing: Cross,
  communion: Church,
  liturgy: FileText,
  announcement: Megaphone,
  free: FileText,
  music: Music,
  lesson_objective: Target,
  warmup: Sparkles,
  input: Mic,
  activity: Users,
  worksheet: ClipboardList,
  discussion: MessagesSquare,
  reflection: Lightbulb,
  homework: House,
  video: Video,
  image: ImageIcon,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  song: "Lied",
  reading: "Lesung",
  sermon: "Predigt",
  prayer: "Gebet",
  blessing: "Segen",
  communion: "Abendmahl",
  liturgy: "Liturgie",
  announcement: "Mitteilung",
  free: "Freier Block",
  music: "Instrumentalmusik",
  lesson_objective: "Lernziel",
  warmup: "Einstieg",
  input: "Input",
  activity: "Aktivität",
  worksheet: "Arbeitsblatt",
  discussion: "Diskussion",
  reflection: "Reflexion",
  homework: "Hausaufgabe",
  video: "Video",
  image: "Bild",
};

const BLOCK_COLORS: Record<BlockType, string> = {
  song: "border-l-blue-500",
  reading: "border-l-green-500",
  sermon: "border-l-amber-500",
  prayer: "border-l-purple-500",
  blessing: "border-l-yellow-500",
  communion: "border-l-red-500",
  liturgy: "border-l-teal-500",
  announcement: "border-l-gray-500",
  free: "border-l-slate-400",
  music: "border-l-indigo-500",
  lesson_objective: "border-l-emerald-600",
  warmup: "border-l-orange-500",
  input: "border-l-amber-500",
  activity: "border-l-blue-600",
  worksheet: "border-l-cyan-500",
  discussion: "border-l-purple-500",
  reflection: "border-l-yellow-600",
  homework: "border-l-rose-500",
  video: "border-l-red-600",
  image: "border-l-fuchsia-500",
};

interface ServiceBlockProps {
  block: ServiceBlockData;
  onUpdate: (id: string, updates: Partial<ServiceBlockData>) => void;
  onDelete: (id: string) => void;
  onAskBibleBot: (block: ServiceBlockData) => void;
  onPickResource?: (block: ServiceBlockData) => void;
}

export function ServiceBlock({ block, onUpdate, onDelete, onAskBibleBot, onPickResource }: ServiceBlockProps) {
  const [expanded, setExpanded] = useState(true);
  const [titleFocused, setTitleFocused] = useState(false);
  const mediaUrl = (block.metadata?.mediaUrl as string) || "";

  const embedInfo = useMemo(() => {
    if (!mediaUrl) return null;
    // YouTube
    const ytMatch = mediaUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: "youtube" as const, id: ytMatch[1] };
    // Spotify
    const spMatch = mediaUrl.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (spMatch) return { type: "spotify" as const, kind: spMatch[1], id: spMatch[2] };
    // Apple Music
    const amMatch = mediaUrl.match(/music\.apple\.com\/([a-z]{2})\/(album|playlist|song)\/[^/]+\/([a-zA-Z0-9.?=&-]+)/);
    if (amMatch) return { type: "apple" as const, country: amMatch[1], kind: amMatch[2], path: mediaUrl.replace("https://music.apple.com/", "") };
    return null;
  }, [mediaUrl]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? "box-shadow 0.2s ease, transform 0.0s"
      : transition ?? "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? "1.02" : undefined,
    boxShadow: isDragging
      ? "0 12px 28px -4px rgba(0,0,0,0.25), 0 4px 10px -2px rgba(0,0,0,0.15)"
      : undefined,
  };

  const Icon = BLOCK_ICONS[block.type];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-l-4 ${BLOCK_COLORS[block.type]} transition-shadow duration-200 ${isDragging ? "ring-2 ring-primary/30 rounded-lg" : ""}`}
    >
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </button>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{BLOCK_LABELS[block.type]}</span>
        <div className="flex-1 relative">
          <Input
            value={block.title}
            onChange={(e) => onUpdate(block.id, { title: e.target.value })}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTimeout(() => setTitleFocused(false), 200)}
            placeholder={`${BLOCK_LABELS[block.type]}-Titel`}
            className="h-8 text-sm border-0 bg-transparent px-2 focus-visible:ring-1"
          />
          <ResourceSuggest
            query={block.title}
            blockType={block.type}
            visible={titleFocused}
            onSelect={(resource: Resource) => {
              onUpdate(block.id, {
                title: resource.title,
                content: resource.content ?? "",
                metadata: { ...block.metadata, resourceId: resource.id },
              });
              setTitleFocused(false);
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          {onPickResource && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onPickResource(block)} title="Aus Bibliothek">
              <Library className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => onAskBibleBot(block)} title="BibleBot fragen">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(block.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-0 pl-12">
          <Textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
            placeholder="Inhalt, Notizen, Bibelstelle..."
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="number"
              value={block.duration || ""}
              onChange={(e) => onUpdate(block.id, { duration: parseInt(e.target.value) || undefined })}
              placeholder="Min."
              className="w-20 h-7 text-xs"
            />
            <span className="text-xs text-muted-foreground">Minuten</span>
          </div>
          {(block.type === "song" || block.type === "music") && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={mediaUrl}
                  onChange={(e) => onUpdate(block.id, { metadata: { ...block.metadata, mediaUrl: e.target.value } })}
                  placeholder="Spotify, YouTube oder Apple Music Link einfügen..."
                  className="flex-1 h-7 text-xs"
                />
                {mediaUrl && !embedInfo && (
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </div>
              {embedInfo?.type === "youtube" && (
                <div className="rounded-md overflow-hidden aspect-video max-h-40">
                  <iframe
                    src={`https://www.youtube.com/embed/${embedInfo.id}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube"
                  />
                </div>
              )}
              {embedInfo?.type === "spotify" && (
                <div className="rounded-md overflow-hidden">
                  <iframe
                    src={`https://open.spotify.com/embed/${embedInfo.kind}/${embedInfo.id}?theme=0`}
                    className="w-full rounded-lg"
                    height="80"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify"
                  />
                </div>
              )}
              {embedInfo?.type === "apple" && (
                <div className="rounded-md overflow-hidden">
                  <iframe
                    src={`https://embed.music.apple.com/${embedInfo.path}`}
                    className="w-full rounded-lg"
                    height="175"
                    allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                    loading="lazy"
                    title="Apple Music"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export { BLOCK_LABELS, BLOCK_ICONS };
