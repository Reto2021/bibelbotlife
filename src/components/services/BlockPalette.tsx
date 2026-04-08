import { Music, BookOpen, Mic, HandHeart, Cross, Church, FileText, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-wrap gap-1.5">
      {PALETTE_ITEMS.map((item) => (
        <Button
          key={item.type}
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => onAdd(item.type)}
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </Button>
      ))}
    </div>
  );
}
