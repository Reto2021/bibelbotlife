import { useState } from "react";
import { Share2, Check, Copy, Send, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  utmSource?: string;
  variant?: "icon" | "button";
  className?: string;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12.056 0h-.112zM17.1 7.2l-1.8 8.49c-.135.6-.488.744-.99.463l-2.733-2.015-1.32 1.27c-.146.146-.268.268-.55.268l.197-2.79 5.07-4.58c.22-.196-.048-.305-.342-.11l-6.27 3.95-2.7-.844c-.587-.183-.598-.587.122-.87l10.555-4.07c.49-.176.916.12.76.84z" />
    </svg>
  );
}

export function ShareButton({ title, text, url, utmSource = "share", variant = "icon", className = "" }: ShareButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const baseUrl = url || "https://bibelbot.ch";
  const shareUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}utm_source=${utmSource}&utm_medium=social`;
  const shareText = `${text}\n\n— ${title}`;
  const fullShareText = `${shareText}\n${shareUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return true;
      } catch (e) {
        if ((e as Error).name === "AbortError") return true;
      }
    }
    return false;
  };

  const handleClick = async () => {
    const shared = await handleNativeShare();
    if (!shared) setOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      toast({ title: t("share.copied"), description: t("share.copiedDesc") });
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    } catch {
      toast({ title: t("share.error"), variant: "destructive" });
    }
  };

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const platforms = [
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(fullShareText)}`,
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
    },
    {
      name: "Telegram",
      icon: TelegramIcon,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      color: "hover:bg-[#0088cc]/10 hover:text-[#0088cc]",
    },
    {
      name: "X",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: "hover:bg-foreground/10 hover:text-foreground",
    },
    {
      name: "E-Mail",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullShareText)}`,
      color: "hover:bg-primary/10 hover:text-primary",
    },
  ];

  const triggerButton = variant === "icon" ? (
    <button
      className={`text-primary/60 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary/10 ${className}`}
      title={t("share.label")}
      aria-label={t("share.label")}
    >
      <Share2 className="h-5 w-5" />
    </button>
  ) : (
    <Button
      size="sm"
      variant="outline"
      className={`text-xs border-primary/30 text-primary hover:bg-primary/10 ${className}`}
    >
      <Share2 className="h-3 w-3 mr-1.5" />
      {t("share.label")}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => { e.preventDefault(); handleClick(); }}>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" side="top" align="end">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{t("share.shareVia")}</p>
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground transition-colors ${p.color}`}
            >
              <p.icon className="h-4 w-4" />
              {p.name}
            </a>
          ))}
          <div className="border-t border-border my-1" />
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors w-full"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? t("share.copiedShort") : t("share.copyLink")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
