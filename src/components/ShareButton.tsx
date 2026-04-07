import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function ShareButton({ title, text, url, variant = "icon", className = "" }: ShareButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = url || "https://bibelbot.ch";
  const shareText = `${text}\n\n— ${title}\n${shareUrl}`;

  const handleShare = async () => {
    // Try native Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${text}\n\n— ${title}`, url: shareUrl });
        return;
      } catch (e) {
        // User cancelled or not supported — fall through to copy
        if ((e as Error).name === "AbortError") return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: t("share.copied"), description: t("share.copiedDesc") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("share.error"), variant: "destructive" });
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className={`text-muted-foreground hover:text-primary transition-colors ${className}`}
        title={t("share.label")}
        aria-label={t("share.label")}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Share2 className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleShare}
      className={`text-xs border-primary/30 text-primary hover:bg-primary/10 ${className}`}
    >
      {copied ? <Check className="h-3 w-3 mr-1.5" /> : <Share2 className="h-3 w-3 mr-1.5" />}
      {t("share.label")}
    </Button>
  );
}
