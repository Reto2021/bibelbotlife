import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImageUp, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMyCrossPosts, type MyCrossPost } from "@/hooks/use-cross-posts";
import { MAX_BURN_QUOTE_LENGTH } from "@/lib/burn-quote";

export function MyCrosses() {
  const { t } = useTranslation();
  const { posts, loading, update, remove } = useMyCrossPosts();
  const [editing, setEditing] = useState<MyCrossPost | null>(null);
  const [deleting, setDeleting] = useState<MyCrossPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    placeLabel: "",
    story: "",
    quote: "",
    quoteReference: "",
    authorName: "",
    isAnonymous: true,
  });

  // Local preview of the replacement photo; revoked when it changes or unmounts.
  useEffect(() => {
    if (!newPhoto) {
      setNewPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(newPhoto);
    setNewPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newPhoto]);

  function openEdit(post: MyCrossPost) {
    setForm({
      placeLabel: post.place_label ?? "",
      story: post.story ?? "",
      quote: post.quote ?? "",
      quoteReference: post.quote_reference ?? "",
      authorName: post.author_name ?? "",
      isAnonymous: post.is_anonymous,
    });
    setNewPhoto(null);
    setEditing(post);
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("crossways.mine.photoInvalid", { defaultValue: "Bitte wähle eine Bilddatei." }));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error(t("crossways.mine.photoTooLarge", { defaultValue: "Das Bild ist zu gross (max. 15 MB)." }));
      return;
    }
    setNewPhoto(file);
  }

  async function save() {
    if (!editing) return;
    if (!form.placeLabel.trim()) {
      toast.error(t("crossways.mine.placeRequired"));
      return;
    }
    setSaving(true);
    try {
      await update({
        id: editing.id,
        placeLabel: form.placeLabel,
        story: form.story || null,
        quote: form.quote || null,
        quoteReference: form.quoteReference || null,
        authorName: form.authorName || null,
        isAnonymous: form.isAnonymous,
        file: newPhoto,
      });
      toast.success(
        newPhoto
          ? t("crossways.mine.photoReplaced", { defaultValue: "Neues Foto gespeichert und geprüft" })
          : t("crossways.mine.saved"),
      );
      setNewPhoto(null);
      setEditing(null);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const msg = code === "blocked"
        ? t("crossways.upload.blockedTitle")
        : code === "image_too_large"
          ? t("crossways.mine.photoTooLarge", { defaultValue: "Das Bild ist zu gross (max. 15 MB)." })
          : code === "unsupported_format"
            ? t("crossways.mine.photoInvalid", { defaultValue: "Bitte wähle eine Bilddatei." })
            : t("crossways.mine.saveError");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove(deleting.id);
      toast.success(t("crossways.mine.deleted"));
    } catch {
      toast.error(t("crossways.mine.deleteError"));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 p-8 text-center">
        <p className="text-muted-foreground">{t("crossways.mine.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("crossways.mine.hint")}</p>

      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.place_label}
                loading="lazy"
                className="h-40 w-full rounded-lg object-cover sm:w-48"
              />
            )}
            <div className="flex-1 space-y-2">
              <p className="font-medium">{post.place_label}</p>
              {post.story && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.story}</p>
              )}
              {post.quote && (
                <p className="text-sm italic text-muted-foreground">
                  «{post.quote}»{post.quote_reference ? ` — ${post.quote_reference}` : ""}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()} · {`${post.prayer_count} × ${t("crossways.card.prayer")}`}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(post)}>
                  <Pencil className="h-4 w-4" /> {t("crossways.mine.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-destructive"
                  onClick={() => setDeleting(post)}
                >
                  <Trash2 className="h-4 w-4" /> {t("crossways.mine.delete")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("crossways.mine.editTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("crossways.mine.photoLabel", { defaultValue: "Foto" })}</Label>
              <div className="flex gap-3">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {(newPhotoUrl || editing?.image_url) && (
                    <img
                      src={newPhotoUrl || editing?.image_url || ""}
                      alt={form.placeLabel}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {newPhoto && (
                    <button
                      type="button"
                      aria-label={t("crossways.mine.photoReset", { defaultValue: "Neues Foto verwerfen" })}
                      onClick={() => setNewPhoto(null)}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      pickPhoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageUp className="h-4 w-4" />
                    {t("crossways.mine.replacePhoto", { defaultValue: "Foto ersetzen" })}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {newPhoto
                      ? t("crossways.mine.photoPending", {
                          defaultValue: "Neues Foto wird beim Speichern erneut geprüft.",
                        })
                      : t("crossways.mine.replacePhotoHint", {
                          defaultValue:
                            "Du kannst das Foto ersetzen, ohne den Beitrag zu löschen – Reaktionen und Link bleiben erhalten.",
                        })}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("crossways.upload.placeLabel")}</Label>
              <Input
                value={form.placeLabel}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, placeLabel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("crossways.upload.storyLabel")}</Label>
              <Textarea
                rows={3}
                maxLength={500}
                value={form.story}
                onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("crossways.upload.quoteLabel")}</Label>
              <Textarea
                rows={2}
                maxLength={MAX_BURN_QUOTE_LENGTH * 2}
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              />
              <Input
                placeholder={t("crossways.upload.quoteReferencePlaceholder")}
                maxLength={80}
                value={form.quoteReference}
                onChange={(e) => setForm((f) => ({ ...f, quoteReference: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <Label htmlFor="mine-anon" className="cursor-pointer">
                {t("crossways.upload.anonymousLabel")}
              </Label>
              <Switch
                id="mine-anon"
                checked={form.isAnonymous}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isAnonymous: v }))}
              />
            </div>
            {!form.isAnonymous && (
              <Input
                placeholder={t("crossways.upload.authorLabel")}
                maxLength={60}
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t("crossways.mine.cancel")}
            </Button>
            <Button onClick={save} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("crossways.mine.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("crossways.mine.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("crossways.mine.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("crossways.mine.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t("crossways.mine.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
