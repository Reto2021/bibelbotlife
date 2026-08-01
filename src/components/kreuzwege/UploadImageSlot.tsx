import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Crop, Loader2, Move, RotateCcw, RotateCw, X, ZoomIn } from "lucide-react";
import { burnQuoteIntoImage } from "@/lib/burn-quote";
import {
  applyImageEdits,
  clampCropOffset,
  CROP_ASPECTS,
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  type CropAspect,
} from "@/lib/transform-image";

/**
 * One selected image inside the upload dialog: owns its rotation/zoom/crop state,
 * renders its own preview (incl. burned-in quote) and reports the edited file up.
 * The preview always shows the rendered result, so what you see is what is sent.
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
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropMode, setCropMode] = useState(false);

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
    const timer = setTimeout(async () => {
      let result = file;
      try {
        result = await applyImageEdits(file, {
          rotation,
          aspect,
          zoom,
          offsetX: offset.x,
          offsetY: offset.y,
        });
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
    }, 140);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, rotation, aspect, zoom, offset.x, offset.y]);

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

  // --- manual crop interactions -------------------------------------------
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const applyZoom = useCallback((next: number, keepOffset = true) => {
    const clamped = Math.min(MAX_CROP_ZOOM, Math.max(MIN_CROP_ZOOM, next));
    setZoom(clamped);
    setOffset((prev) =>
      keepOffset
        ? { x: clampCropOffset(prev.x, clamped), y: clampCropOffset(prev.y, clamped) }
        : { x: 0, y: 0 },
    );
  }, []);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Native, non-passive wheel listener: React's onWheel cannot preventDefault.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !cropMode) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      applyZoom(zoomRef.current * Math.exp(-dy * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [cropMode, applyZoom]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!cropMode) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const nx = drag.ox + (e.clientX - drag.x) / rect.width;
    const ny = drag.oy + (e.clientY - drag.y) / rect.height;
    setOffset({ x: clampCropOffset(nx, zoom), y: clampCropOffset(ny, zoom) });
  }

  function endDrag() {
    dragRef.current = null;
  }

  const dirty = rotation !== 0 || aspect !== targetAspect || zoom !== 1 || offset.x !== 0 || offset.y !== 0;

  function resetAll() {
    setRotation(0);
    setAspect(targetAspect);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

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
            <Button
              type="button"
              size="sm"
              variant={cropMode ? "default" : "outline"}
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => setCropMode((v) => !v)}
            >
              <Move className="h-3.5 w-3.5" />
              {t("crossways.upload.cropManual", "Ausschnitt wählen")}
            </Button>
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
            {dirty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2"
                onClick={resetAll}
              >
                {t("crossways.upload.editReset", "Zurücksetzen")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {cropMode && (
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-2">
          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative mx-auto max-h-[50vh] w-full cursor-grab touch-none select-none overflow-hidden rounded-md bg-background active:cursor-grabbing"
          >
            {preview ? (
              <img
                src={preview}
                alt={t("crossways.upload.cropManual", "Ausschnitt wählen")}
                className="pointer-events-none mx-auto max-h-[50vh] w-auto max-w-full"
                draggable={false}
              />
            ) : (
              <div className="h-48 w-full animate-pulse bg-muted" />
            )}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={MIN_CROP_ZOOM}
              max={MAX_CROP_ZOOM}
              step={0.02}
              onValueChange={([v]) => applyZoom(v)}
              aria-label={t("crossways.upload.cropZoom", "Zoom")}
            />
            <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
              {zoom.toFixed(1)}×
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "crossways.upload.cropHint",
              "Ziehen zum Verschieben, Scrollen oder Slider zum Zoomen. Die Vorschau zeigt genau das Ergebnis.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
