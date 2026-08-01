import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Crop, Crosshair, Loader2, Plus, Quote, RotateCcw, RotateCw, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  MIN_IMAGE_DIMENSION,
  validateImageContent,
  validateImageFile,
  type ImageValidationResult,
} from "@/lib/validate-image";

import { submitCrossPost } from "@/hooks/use-cross-posts";
import { burnQuoteIntoImage, withQuotationMarks } from "@/lib/burn-quote";
import { applyImageEdits, CROP_ASPECTS, type CropAspect } from "@/lib/transform-image";
import { VersePicker } from "./VersePicker";

const CrossMap = lazy(() => import("./CrossMap"));

export function CrossUploadDialog({
  onSubmitted,
  defaultOpen = false,
  onOpenChange,
}: {
  onSubmitted: () => void;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) reset();
  }
  const [file, setFile] = useState<File | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState("");
  const [country, setCountry] = useState("");
  const [story, setStory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [quote, setQuote] = useState("");
  const [quoteReference, setQuoteReference] = useState("");
  const [burnQuote, setBurnQuote] = useState(true);
  const [burnedPreview, setBurnedPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<CropAspect>("original");
  const [editing, setEditing] = useState(false);

  // Apply rotation/crop; `editedFile` is what gets previewed and uploaded.
  useEffect(() => {
    let cancelled = false;
    if (!file) {
      setEditedFile(null);
      setPreview(null);
      return;
    }
    setEditing(true);
    (async () => {
      let result = file;
      try {
        result = await applyImageEdits(file, { rotation, aspect });
      } catch {
        result = file;
      }
      if (cancelled) return;
      setEditedFile(result);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(result);
      });
      setEditing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [file, rotation, aspect]);

  // Live preview of the burned-in quote (same renderer as the upload).
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    if (!editedFile || !burnQuote || !quote.trim()) {
      setBurnedPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const blob = await burnQuoteIntoImage(editedFile, {
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
  }, [editedFile, quote, quoteReference, burnQuote]);

  function reset() {
    setFile(null);
    setEditedFile(null);
    setPreview(null);
    setPlaceLabel("");
    setCountry("");
    setStory("");
    setAuthorName("");
    setIsAnonymous(false);
    setConsent(false);
    setCoords(null);
    setShowPicker(false);
    setDragActive(false);
    setQuote("");
    setQuoteReference("");
    setBurnQuote(true);
    setBurnedPreview(null);
    setRotation(0);
    setAspect("original");
    setEditing(false);
  }

  function rejectFile(result: ImageValidationResult) {
    const messages: Record<string, { title: string; description?: string }> = {
      notAnImage: { title: t("crossways.upload.notAnImage") },
      empty: { title: t("crossways.upload.fileEmpty", "Die Datei ist leer.") },
      unsupportedFormat: {
        title: t("crossways.upload.unsupportedFormat", "Dateiformat nicht unterstützt"),
        description: t("crossways.upload.unsupportedFormatDesc", "Erlaubt sind: {{formats}}.").replace(
          "{{formats}}",
          String(result.values?.formats ?? ""),
        ),
      },
      convertHeic: {
        title: t("crossways.upload.unsupportedFormat", "Dateiformat nicht unterstützt"),
        description: t(
          "crossways.upload.convertHeicDesc",
          "HEIC/TIFF kann nicht angezeigt werden. Bitte als JPG oder PNG speichern.",
        ),
      },
      tooBig: {
        title: t("crossways.upload.imageTooBig"),
        description: t("crossways.upload.imageTooBigDesc"),
      },
      unreadable: {
        title: t("crossways.upload.imageUnreadable", "Bild konnte nicht gelesen werden"),
        description: t("crossways.upload.imageUnreadableDesc", "Bitte eine andere Datei wählen."),
      },
      tooSmall: {
        title: t("crossways.upload.imageTooSmall", "Bild zu klein"),
        description: t("crossways.upload.imageTooSmallDesc", "Mindestens {{min}} x {{min}} Pixel.").replace(
          /{{min}}/g,
          String(result.values?.min ?? MIN_IMAGE_DIMENSION),
        ),
      },
    };
    const msg = messages[result.code ?? "notAnImage"] ?? messages.notAnImage;
    toast({ ...msg, variant: "destructive" });
  }

  async function pickFile(f: File | undefined) {
    if (!f) return;
    const basic = validateImageFile(f);
    if (!basic.ok) {
      rejectFile(basic);
      return;
    }
    const content = await validateImageContent(f);
    if (!content.ok) {
      rejectFile(content);
      return;
    }
    setRotation(0);
    setAspect("original");
    setFile(f);
  }


  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    void pickFile(e.dataTransfer.files?.[0]);
  }


  function useMyLocation() {
    if (!navigator.geolocation) {
      toast({ title: t("crossways.locationUnavailable"), variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast({ title: t("crossways.locationDenied"), description: t("crossways.upload.locationDeniedDesc") }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const upload = editedFile ?? file;
    if (!upload || !placeLabel.trim() || !consent || editing) return;
    setSubmitting(true);
    try {
      await submitCrossPost({
        file: upload,
        placeLabel,
        country,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        story,
        authorName,
        isAnonymous,
        quote,
        quoteReference,
        burnQuote,
      });
      toast({
        title: t("crossways.upload.successTitle"),
        description: t("crossways.upload.successDesc"),
      });
      reset();
      setOpen(false);
      onSubmitted();
    } catch (err) {
      if (err instanceof ModerationError) {
        toast({
          title: t("crossways.upload.blockedTitle", "Inhalt nicht erlaubt"),
          description: t(
            "crossways.upload.blockedDesc",
            "Dieser Beitrag verstösst gegen unsere Regeln (keine sexuellen, rassistischen oder gewaltverherrlichenden Inhalte).",
          ),
          variant: "destructive",
        });
        return;
      }
      toast({
        title: t("crossways.upload.errorTitle"),
        description: err instanceof Error ? err.message : t("crossways.upload.errorDesc"),
        variant: "destructive",
      });

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> {t("crossways.upload.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("crossways.upload.title")}</DialogTitle>
          <DialogDescription>{t("crossways.upload.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cross-photo">{t("crossways.upload.photoLabel")}</Label>
            <label
              htmlFor="cross-photo"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
              }`}
            >
              {preview ? (
                <>
                  <img
                    src={burnedPreview ?? preview}
                    alt={t("crossways.upload.photoLabel")}
                    className="max-h-48 rounded-lg object-cover"
                  />
                  <span className="text-xs">{t("crossways.upload.replaceHint")}</span>
                </>
              ) : (
                <>
                  <Upload className={`h-6 w-6 ${dragActive ? "text-primary" : "text-primary/80"}`} />
                  <span>{t("crossways.upload.photoPlaceholder")}</span>
                  <span className="text-xs">{t("crossways.upload.dropHint")}</span>
                </>
              )}
            </label>
            {file && (
              <div className="space-y-3 rounded-xl border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="mr-auto flex items-center gap-1.5 text-sm">
                    <Crop className="h-4 w-4 text-primary" />
                    {t("crossways.upload.editImage", "Bild bearbeiten")}
                  </Label>
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
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-muted-foreground">
                    {t("crossways.upload.cropLabel", "Zuschnitt")}
                  </span>
                  {CROP_ASPECTS.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={aspect === option ? "default" : "outline"}
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setAspect(option)}
                    >
                      {option === "original"
                        ? t("crossways.upload.cropOriginal", "Original")
                        : option}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {editing ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("crossways.upload.editApplying", "Bearbeitung wird angewendet …")}
                      </span>
                    ) : (
                      <>
                        {file.name} ·{" "}
                        {(((editedFile ?? file).size) / 1024 / 1024).toFixed(1)} MB
                      </>
                    )}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    {(rotation !== 0 || aspect !== "original") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          setRotation(0);
                          setAspect("original");
                        }}
                      >
                        {t("crossways.upload.editReset", "Zurücksetzen")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-3.5 w-3.5" /> {t("crossways.upload.removeImage")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <input
              id="cross-photo"
              type="file"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              className="hidden"
              onChange={(e) => void pickFile(e.target.files?.[0])}
            />


          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cross-place">{t("crossways.upload.placeLabel")}</Label>
              <Input
                id="cross-place"
                value={placeLabel}
                maxLength={120}
                required
                placeholder={t("crossways.upload.placePlaceholder")}
                onChange={(e) => setPlaceLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cross-country">{t("crossways.upload.countryLabel")}</Label>
              <Input
                id="cross-country"
                value={country}
                maxLength={60}
                placeholder={t("crossways.upload.countryPlaceholder")}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={useMyLocation} className="gap-1.5">
                <Crosshair className="h-4 w-4" /> {t("crossways.upload.useLocation")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPicker((v) => !v)}
              >
                {showPicker ? t("crossways.upload.closeMap") : t("crossways.upload.openMap")}
              </Button>
              {coords && (
                <span className="text-xs text-muted-foreground">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              )}
            </div>
            {showPicker && (
              <Suspense fallback={<div className="h-52 rounded-xl bg-muted/40" />}>
                <CrossMap
                  height="13rem"
                  zoom={coords ? 12 : 7}
                  center={coords ? [coords.lat, coords.lng] : undefined}
                  pickMode
                  picked={coords}
                  onPick={(lat, lng) => setCoords({ lat, lng })}
                />
              </Suspense>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cross-story">{t("crossways.upload.storyLabel")}</Label>
            <Textarea
              id="cross-story"
              value={story}
              maxLength={500}
              rows={3}
              placeholder={t("crossways.upload.storyPlaceholder")}
              onChange={(e) => setStory(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">{story.length}/500</p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="cross-quote" className="flex items-center gap-1.5">
                <Quote className="h-4 w-4 text-primary" />
                {t("crossways.upload.quoteLabel", "Bibelzitat oder Gedanke")}
              </Label>
              <VersePicker
                onPick={(text, reference) => {
                  setQuote(text);
                  setQuoteReference(reference);
                }}
              />
            </div>
            <Textarea
              id="cross-quote"
              value={quote}
              maxLength={280}
              rows={2}
              placeholder={t("crossways.upload.quotePlaceholder", "z. B. Der Herr ist mein Hirte")}
              onChange={(e) => setQuote(e.target.value)}
            />
            <div className="flex items-center justify-between gap-2">
              <Input
                value={quoteReference}
                maxLength={80}
                placeholder={t("crossways.upload.quoteReferencePlaceholder", "Quelle, z. B. Psalm 23,1")}
                onChange={(e) => setQuoteReference(e.target.value)}
              />
              <span className="shrink-0 text-xs text-muted-foreground">{quote.length}/280</span>
            </div>
            {quote.trim() && (
              <p className="text-sm italic text-muted-foreground">
                {withQuotationMarks(quote)}
                {quoteReference.trim() && <span className="not-italic"> — {quoteReference.trim()}</span>}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Label htmlFor="cross-burn" className="text-sm font-normal leading-snug">
                {t("crossways.upload.burnQuoteLabel", "Zitat aufs Foto schreiben")}
              </Label>
              <Switch
                id="cross-burn"
                checked={burnQuote}
                disabled={!quote.trim()}
                onCheckedChange={setBurnQuote}
              />
            </div>
            {burnQuote && quote.trim() && (
              <p className="text-xs text-muted-foreground">
                {t("crossways.upload.burnQuoteHint", "Die Vorschau oben zeigt, wie das Foto hochgeladen wird.")}
              </p>
            )}
          </div>


          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <Label htmlFor="cross-anon" className="text-sm font-normal">{t("crossways.upload.anonymousLabel")}</Label>
            <Switch id="cross-anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          {!isAnonymous && (
            <div className="space-y-1.5">
              <Label htmlFor="cross-author">{t("crossways.upload.authorLabel")}</Label>
              <Input
                id="cross-author"
                value={authorName}
                maxLength={60}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
            <Checkbox
              id="cross-consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
            />
            <Label htmlFor="cross-consent" className="text-xs font-normal leading-relaxed">
              {t("crossways.upload.consent")}
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !file || !placeLabel.trim() || !consent}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("crossways.upload.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
