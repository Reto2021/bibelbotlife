import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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

  const [form, setForm] = useState({
    placeLabel: "",
    story: "",
    quote: "",
    quoteReference: "",
    authorName: "",
    isAnonymous: true,
  });

  function openEdit(post: MyCrossPost) {
    setForm({
      placeLabel: post.place_label ?? "",
      story: post.story ?? "",
      quote: post.quote ?? "",
      quoteReference: post.quote_reference ?? "",
      authorName: post.author_name ?? "",
      isAnonymous: post.is_anonymous,
    });
    setEditing(post);
  }

  async function save() {
    if (!editing) return;
    if (!form.placeLabel.trim()) {
      toast.error(t("crossways.upload.placeRequired"));
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
      });
      toast.success(t("crossways.mine.saved"));
      setEditing(null);
    } catch (e) {
      const msg = e instanceof Error && e.message === "blocked"
        ? t("crossways.moderation.blocked")
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
                {new Date(post.created_at).toLocaleDateString()} · {t("crossways.card.prayers", { count: post.prayer_count })}
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
            <div className="space-y-1.5">
              <Label>{t("crossways.upload.place")}</Label>
              <Input
                value={form.placeLabel}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, placeLabel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("crossways.upload.story")}</Label>
              <Textarea
                rows={3}
                maxLength={500}
                value={form.story}
                onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("crossways.upload.quote")}</Label>
              <Textarea
                rows={2}
                maxLength={MAX_BURN_QUOTE_LENGTH * 2}
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              />
              <Input
                placeholder={t("crossways.upload.quoteReference")}
                maxLength={80}
                value={form.quoteReference}
                onChange={(e) => setForm((f) => ({ ...f, quoteReference: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">{t("crossways.mine.imageLocked")}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <Label htmlFor="mine-anon" className="cursor-pointer">
                {t("crossways.upload.anonymous")}
              </Label>
              <Switch
                id="mine-anon"
                checked={form.isAnonymous}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isAnonymous: v }))}
              />
            </div>
            {!form.isAnonymous && (
              <Input
                placeholder={t("crossways.upload.name")}
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
