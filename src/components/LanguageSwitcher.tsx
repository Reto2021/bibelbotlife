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
  { code: "de", flag: "🇩🇪" },
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
  // Middle East
  { code: "ar", flag: "🇸🇦" },
  { code: "he", flag: "🇮🇱" },
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

  const currentLang = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Language"
        >
          <span className="text-sm sm:text-base leading-none">{currentLang.flag}</span>
          <span className="hidden sm:inline uppercase text-xs font-medium">{currentLang.code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] p-0">
        <ScrollArea className="h-[320px]">
          <div className="p-1">
            {LANGS.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`flex items-center gap-2 ${i18n.language === lang.code ? "bg-accent font-semibold" : ""}`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1">{t(`lang.${lang.code}`)}</span>
                {i18n.language === lang.code && (
                  <span className="text-primary text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
