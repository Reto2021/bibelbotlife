import { Music, BookOpen, Mic, HandHeart, Cross, Church, FileText, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BlockType } from "./ServiceBlock";

const PALETTE_ITEMS: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: "song", label: "Lied", icon: Music },
  { type: "reading", label: "Lesung", icon: BookOpen },
  { type: "sermon", label: "Predigt", icon: Mic },
  { type: "prayer", label: "Gebet", icon: HandHeart },
  { type: "blessing", label: "Segen", icon: Cross },
  { type: "communion", label: "Abendmahl", icon: Church },
  { type: "liturgy", label: "Liturgie", icon: FileText },
  { type: "announcement", label: "Mitteilung", icon: Megaphone },
  { type: "music", label: "Musik", icon: Music },
  { type: "free", label: "Frei", icon: FileText },
];

interface BlockPaletteProps {
  onAdd: (type: BlockType) => void;
}

export function BlockPalette({ onAdd }: BlockPaletteProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {PALETTE_ITEMS.map((item) => (
        <Tooltip key={item.type}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 px-2 sm:px-3"
              onClick={() => onAdd(item.type)}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="sm:hidden">{item.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
