import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart, Send, Mail, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

const REFER_URL = "https://bibelbot.ch?utm_source=refer&utm_medium=link";

export function ReferralSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareChannels = [
    {
      name: t("refer.whatsapp"),
      icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(t("refer.whatsappMsg"))}`,
      bg: "bg-[#25D366]",
      hoverBg: "hover:bg-[#20bd5a]",
      text: "text-white",
    },
    {
      name: t("refer.telegram"),
      icon: TelegramIcon,
      href: `https://t.me/share/url?url=${encodeURIComponent("https://bibelbot.ch?utm_source=refer&utm_medium=telegram")}&text=${encodeURIComponent(t("refer.telegramMsg"))}`,
      bg: "bg-[#0088cc]",
      hoverBg: "hover:bg-[#007ab8]",
      text: "text-white",
    },
    {
      name: t("refer.email"),
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(t("refer.emailSubject"))}&body=${encodeURIComponent(t("refer.emailBody"))}`,
      bg: "bg-primary",
      hoverBg: "hover:bg-primary/90",
      text: "text-primary-foreground",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REFER_URL);
      setCopied(true);
      toast({ title: t("refer.copied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            <Heart className="h-4 w-4" />
            {t("refer.badge")}
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">{t("refer.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t("refer.subtitle")}</p>
        </div>

        {/* Share Buttons */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {shareChannels.map((channel) => (
            <a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl ${channel.bg} ${channel.hoverBg} ${channel.text} font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
            >
              <channel.icon className="h-5 w-5" />
              {channel.name}
            </a>
          ))}
        </div>

        {/* Copy Link */}
        <div className="flex items-center gap-3 bg-card/80 border border-border rounded-xl px-4 py-3 mb-8">
          <code className="flex-1 text-sm text-muted-foreground truncate select-all">bibelbot.ch</code>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
          >
            {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
            {copied ? t("refer.copied") : t("refer.copy")}
          </Button>
        </div>

        {/* QR Code */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">{t("refer.qr")}</p>
          <div className="inline-block bg-white rounded-xl p-4 shadow-md">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(REFER_URL)}&margin=0&format=svg`}
              alt="BibelBot QR Code"
              className="h-40 w-40"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
