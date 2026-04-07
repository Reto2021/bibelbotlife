import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const LANGS = [
  // Europe – West
  { code: "de", flag: "🇨🇭" },
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
  { code: "es", flag: "🇪🇸" },
  { code: "it", flag: "🇮🇹" },
  { code: "nl", flag: "🇳🇱" },
  { code: "pt", flag: "🇵🇹" },
  // Nordic
  { code: "da", flag: "🇩🇰" },
  { code: "no", flag: "🇳🇴" },
  { code: "sv", flag: "🇸🇪" },
  { code: "fi", flag: "🇫🇮" },
  // Europe – Central & East
  { code: "pl", flag: "🇵🇱" },
  { code: "cs", flag: "🇨🇿" },
  { code: "sk", flag: "🇸🇰" },
  { code: "hu", flag: "🇭🇺" },
  { code: "ro", flag: "🇷🇴" },
  { code: "hr", flag: "🇭🇷" },
  { code: "sr", flag: "🇷🇸" },
  { code: "bg", flag: "🇧🇬" },
  { code: "el", flag: "🇬🇷" },
  // Slavic / Caucasus
  { code: "ru", flag: "🇷🇺" },
  { code: "uk", flag: "🇺🇦" },
  { code: "ka", flag: "🇬🇪" },
  { code: "hy", flag: "🇦🇲" },
  // Asia
  { code: "ko", flag: "🇰🇷" },
  { code: "zh", flag: "🇨🇳" },
  { code: "vi", flag: "🇻🇳" },
  { code: "id", flag: "🇮🇩" },
  { code: "tl", flag: "🇵🇭" },
  // Africa
  { code: "sw", flag: "🇰🇪" },
  { code: "am", flag: "🇪🇹" },
  { code: "af", flag: "🇿🇦" },
  { code: "zu", flag: "🇿🇦" },
  { code: "yo", flag: "🇳🇬" },
  { code: "ig", flag: "🇳🇬" },
  // Caribbean
  { code: "ht", flag: "🇭🇹" },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Language"
        >
          <Globe className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] p-0">
        <ScrollArea className="h-[320px]">
          <div className="p-1">
            {LANGS.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={i18n.language === lang.code ? "bg-accent font-semibold" : ""}
              >
                <span className="mr-2">{lang.flag}</span>
                {t(`lang.${lang.code}`)}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
