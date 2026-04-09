import type { TTSVoice } from "@/hooks/use-tts";
import { useTranslation } from "react-i18next";

interface VoicePickerProps {
  voice: TTSVoice;
  onChange: (v: TTSVoice) => void;
  className?: string;
}

export function VoicePicker({ voice, onChange, className = "" }: VoicePickerProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={t("tts.voicePicker", "Stimme wählen")}>
      <button
        type="button"
        onClick={() => onChange("male")}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          voice === "male"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-label={t("tts.male", "Männliche Stimme")}
        aria-pressed={voice === "male"}
        title={t("tts.male", "Männliche Stimme")}
      >
        🧑 {t("tts.maleCompact", "Mann")}
      </button>
      <button
        type="button"
        onClick={() => onChange("female")}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          voice === "female"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-label={t("tts.female", "Weibliche Stimme")}
        aria-pressed={voice === "female"}
        title={t("tts.female", "Weibliche Stimme")}
      >
        👩 {t("tts.femaleCompact", "Frau")}
      </button>
    </div>
  );
}
