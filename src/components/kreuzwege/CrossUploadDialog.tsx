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
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Crosshair, Loader2, Plus, Quote, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as notify } from "sonner";
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  MIN_IMAGE_DIMENSION,
  validateImageContent,
  validateImageFile,
  type ImageValidationResult,
} from "@/lib/validate-image";

import { submitCrossPost } from "@/hooks/use-cross-posts";
import { ModerationError } from "@/lib/moderation";
import { withQuotationMarks } from "@/lib/burn-quote";
import { UploadImageSlot } from "./UploadImageSlot";
import { VersePicker } from "./VersePicker";

const CrossMap = lazy(() => import("./CrossMap"));

const MAX_FILES = 6;

interface PickedImage {
  id: string;
  file: File;
}

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

  const [images, setImages] = useState<PickedImage[]>([]);
  const [editedFiles, setEditedFiles] = useState<Record<string, File>>({});
  const [placeLabel, setPlaceLabel] = useState("");
  const [country, setCountry] = useState("");
  const [story, setStory] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [statuses, setStatuses] = useState<
    Record<string, { state: "pending" | "uploading" | "done" | "error"; message?: string }>
  >({});
  const [dragActive, setDragActive] = useState(false);
  const [quote, setQuote] = useState("");
  const [quoteReference, setQuoteReference] = useState("");
  const [burnQuote, setBurnQuote] = useState(true);

  function reset() {
    setImages([]);
    setEditedFiles({});
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
    setProgress(null);
    setStatuses({});
  }

  function rejectFile(result: ImageValidationResult, name?: string) {
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
    toast({
      title: name ? `${name}: ${msg.title}` : msg.title,
      description: msg.description,
      variant: "destructive",
    });
  }

  async function pickFiles(list: FileList | File[] | null | undefined) {
    const incoming = Array.from(list ?? []);
    if (!incoming.length) return;

    const accepted: PickedImage[] = [];
    let limitHit = false;

    for (const f of incoming) {
      if (images.length + accepted.length >= MAX_FILES) {
        limitHit = true;
        break;
      }
      const basic = validateImageFile(f);
      if (!basic.ok) {
        rejectFile(basic, f.name);
        continue;
      }
      const content = await validateImageContent(f);
      if (!content.ok) {
        rejectFile(content, f.name);
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file: f });
    }

    if (limitHit) {
      toast({
        title: t("crossways.upload.maxFilesTitle", "Maximal {{max}} Bilder").replace("{{max}}", String(MAX_FILES)),
        description: t(
          "crossways.upload.maxFilesDesc",
          "Weitere Bilder wurden nicht übernommen. Bitte in mehreren Beiträgen hochladen.",
        ),
      });
    }
    if (accepted.length) setImages((prev) => [...prev, ...accepted]);
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((item) => item.id !== id));
    setEditedFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    void pickFiles(e.dataTransfer.files);
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
    if (!images.length || !placeLabel.trim() || !consent) return;
    setSubmitting(true);
    setProgress({ done: 0, total: images.length });
    setStatuses(Object.fromEntries(images.map((i) => [i.id, { state: "pending" as const }])));

    let uploaded = 0;
    const failures: { name: string; message: string }[] = [];

    for (const item of images) {
      setStatuses((prev) => ({ ...prev, [item.id]: { state: "uploading" } }));
      try {
        await submitCrossPost({
          file: editedFiles[item.id] ?? item.file,
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
        uploaded += 1;
        setStatuses((prev) => ({ ...prev, [item.id]: { state: "done" } }));
      } catch (err) {
        const message =
          err instanceof ModerationError
            ? t(
                "crossways.upload.blockedDesc",
                "Dieser Beitrag verstösst gegen unsere Regeln (keine sexuellen, rassistischen oder gewaltverherrlichenden Inhalte).",
              )
            : err instanceof Error
              ? err.message
              : t("crossways.upload.errorDesc");
        failures.push({ name: item.file.name, message });
        setStatuses((prev) => ({ ...prev, [item.id]: { state: "error", message } }));
      }
      setProgress({ done: uploaded + failures.length, total: images.length });
    }

    setSubmitting(false);

    if (uploaded > 0) {
      notify.success(t("crossways.upload.successTitle"), {
        description:
          uploaded > 1
            ? t("crossways.upload.successDescMany", "{{count}} Bilder wurden veröffentlicht.").replace(
                "{{count}}",
                String(uploaded),
              )
            : t("crossways.upload.successDesc"),
      });
      onSubmitted();
    }

    if (failures.length) {
      notify.error(t("crossways.upload.errorTitle"), {
        description:
          failures.length === 1
            ? `${failures[0].name}: ${failures[0].message}`
            : t("crossways.upload.errorDescMany", "{{count}} Bilder konnten nicht hochgeladen werden.").replace(
                "{{count}}",
                String(failures.length),
              ),
      });
      // Keep the failed images in the dialog so the user can retry.
      const failedNames = new Set(failures.map((f) => f.name));
      setImages((prev) => prev.filter((i) => failedNames.has(i.file.name)));
      setProgress(null);
      return;
    }

    reset();
    setOpen(false);
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
              <Upload className={`h-6 w-6 ${dragActive ? "text-primary" : "text-primary/80"}`} />
              <span>
                {images.length
                  ? t("crossways.upload.addMorePhotos", "Weitere Bilder hinzufügen")
                  : t("crossways.upload.photoPlaceholder")}
              </span>
              <span className="text-xs">
                {t("crossways.upload.dropHint")} ·{" "}
                {t("crossways.upload.multiHint", "Mehrere Bilder möglich (max. {{max}})").replace(
                  "{{max}}",
                  String(MAX_FILES),
                )}
              </span>
            </label>

            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("crossways.upload.selectedCount", "{{count}} von {{max}} Bildern ausgewählt")
                    .replace("{{count}}", String(images.length))
                    .replace("{{max}}", String(MAX_FILES))}
                </p>
                {images.map((item, index) => (
                  <UploadImageSlot
                    key={item.id}
                    file={item.file}
                    index={index}
                    quote={quote}
                    quoteReference={quoteReference}
                    burnQuote={burnQuote}
                    onEdited={(edited) =>
                      setEditedFiles((prev) => ({ ...prev, [item.id]: edited }))
                    }
                    onRemove={() => removeImage(item.id)}
                  />
                ))}
              </div>
            )}

            <input
              id="cross-photo"
              type="file"
              multiple
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              className="hidden"
              onChange={(e) => {
                void pickFiles(e.target.files);
                e.target.value = "";
              }}
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

          {(progress || Object.keys(statuses).length > 0) && (
            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("crossways.upload.progressLabel", "Upload-Fortschritt")}</span>
                {progress && (
                  <span>
                    {progress.done}/{progress.total}
                  </span>
                )}
              </div>
              <Progress
                value={progress ? (progress.done / Math.max(1, progress.total)) * 100 : 100}
                className="h-2"
              />
              <ul className="space-y-1 text-xs">
                {images.map((item) => {
                  const status = statuses[item.id];
                  if (!status) return null;
                  return (
                    <li key={item.id} className="flex items-start gap-1.5">
                      {status.state === "done" && (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      {status.state === "error" && (
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      )}
                      {status.state === "uploading" && (
                        <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                      )}
                      {status.state === "pending" && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
                      {status.state === "error" && (
                        <span className="max-w-[55%] text-right text-destructive">{status.message}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}


          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !images.length || !placeLabel.trim() || !consent}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitting && progress
              ? t("crossways.upload.submitting", "{{done}}/{{total}} hochgeladen …")
                  .replace("{{done}}", String(progress.done))
                  .replace("{{total}}", String(progress.total))
              : t("crossways.upload.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
