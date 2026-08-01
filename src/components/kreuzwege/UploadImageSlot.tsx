import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crop, Loader2, RotateCcw, RotateCw, X } from "lucide-react";
import { burnQuoteIntoImage } from "@/lib/burn-quote";
import { applyImageEdits, CROP_ASPECTS, type CropAspect } from "@/lib/transform-image";

/**
 * One selected image inside the upload dialog: owns its rotation/crop state,
 * renders its own preview (incl. burned-in quote) and reports the edited file up.
 */
export function UploadImageSlot({
  file,
  index,
  quote,
  quoteReference,
  burnQuote,
  targetAspect = "original",
  onEdited,
  onRemove,
}: {
  file: File;
  index: number;
  quote: string;
  quoteReference: string;
  burnQuote: boolean;
  /** Format chosen for all images; applied automatically, can be overridden here. */
  targetAspect?: CropAspect;
  onEdited: (file: File) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<CropAspect>(targetAspect);

  // Follow the dialog-wide target format; a manual pick below still wins afterwards.
  useEffect(() => {
    setAspect(targetAspect);
  }, [targetAspect]);
  const [edited, setEdited] = useState<File>(file);
  const [preview, setPreview] = useState<string | null>(null);
  const [burnedPreview, setBurnedPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEditing(true);
    (async () => {
      let result = file;
      try {
        result = await applyImageEdits(file, { rotation, aspect });
      } catch {
        result = file;
      }
      if (cancelled) return;
      setEdited(result);
      onEdited(result);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(result);
      });
      setEditing(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, rotation, aspect]);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    if (!burnQuote || !quote.trim()) {
      setBurnedPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const blob = await burnQuoteIntoImage(edited, {
          quote,
          reference: quoteReference,
          maxSize: 900,
          quality: 0.8,
        });
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBurnedPreview(url);
      } catch {
        setBurnedPreview(null);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [edited, quote, quoteReference, burnQuote]);

  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-3">
      <div className="flex gap-3">
        {preview ? (
          <img
            src={burnedPreview ?? preview}
            alt={`${t("crossways.upload.photoLabel")} ${index + 1}`}
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <Label className="mr-auto flex min-w-0 items-center gap-1.5 text-sm">
              <Crop className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{file.name}</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label={t("crossways.upload.removeImage")}
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label={t("crossways.upload.rotateLeft", "Nach links drehen")}
              onClick={() => setRotation((r) => (r + 270) % 360)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label={t("crossways.upload.rotateRight", "Nach rechts drehen")}
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            {CROP_ASPECTS.map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={aspect === option ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setAspect(option)}
              >
                {option === "original" ? t("crossways.upload.cropOriginal", "Original") : option}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {editing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("crossways.upload.editApplying", "Bearbeitung wird angewendet …")}
              </span>
            ) : (
              <span>{(edited.size / 1024 / 1024).toFixed(1)} MB</span>
            )}
            {(rotation !== 0 || aspect !== targetAspect) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2"
                onClick={() => {
                  setRotation(0);
                  setAspect(targetAspect);
                }}
              >
                {t("crossways.upload.editReset", "Zurücksetzen")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
