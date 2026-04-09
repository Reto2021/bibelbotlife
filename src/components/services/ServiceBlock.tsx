import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, MessageCircle, Music, BookOpen, Mic, HandHeart, Cross, Church, Megaphone, FileText, ChevronDown, ChevronUp, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export type BlockType = "song" | "reading" | "sermon" | "prayer" | "blessing" | "communion" | "liturgy" | "announcement" | "free" | "music";

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = BLOCK_ICONS[block.type];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-l-4 ${BLOCK_COLORS[block.type]} ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </button>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{BLOCK_LABELS[block.type]}</span>
        <Input
          value={block.title}
          onChange={(e) => onUpdate(block.id, { title: e.target.value })}
          placeholder={`${BLOCK_LABELS[block.type]}-Titel`}
          className="flex-1 h-8 text-sm border-0 bg-transparent px-2 focus-visible:ring-1"
        />
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
        </div>
      )}
    </Card>
  );
}

export { BLOCK_LABELS, BLOCK_ICONS };
