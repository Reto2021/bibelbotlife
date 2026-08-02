import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ImageUp, Loader2, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import { VersePicker } from "@/components/kreuzwege/VersePicker";


/** Cards rendered per batch; keeps the DOM small when a user has many crosses. */
const PAGE_SIZE = 9;

export function MyCrosses() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { posts, loading, update, remove } = useMyCrossPosts();
  const [editing, setEditing] = useState<MyCrossPost | null>(null);
  const [deleting, setDeleting] = useState<MyCrossPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  // Replacement photos stay untouched by default; the user opts in to burning the verse.
  const [burnQuote, setBurnQuote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Client-side list controls: text search on place, status filter, upload-date sort.
  // Hydrate once from URL so filters survive reloads and can be shared as links.
  const initialParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [query, setQuery] = useState(() => initialParams.get("q") ?? "");
  const [status, setStatus] = useState(() => initialParams.get("status") ?? "all");
  const [sort, setSort] = useState(() => initialParams.get("sort") ?? "newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const sp = new URLSearchParams(location.search);
    setQuery(sp.get("q") ?? "");
    setStatus(sp.get("status") ?? "all");
    setSort(sp.get("sort") ?? "newest");
  }, [location.search]);

  // Debounce the search text so the URL doesn't update on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Write clean filter state back to the URL (replace, no history spam).
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const next = new URLSearchParams();
    const q = debouncedQuery.trim();
    if (q) next.set("q", q);
    if (status !== "all") next.set("status", status);
    if (sort !== "newest") next.set("sort", sort);
    if (next.toString() !== sp.toString()) {
      navigate({ search: next.toString() }, { replace: true });
    }
  }, [debouncedQuery, status, sort, location.search, navigate]);

  // Autocomplete: unique place labels from the user's own crosses, ranked by frequency.
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const counts = new Map<string, number>();
    for (const p of posts) {
      const place = (p.place_label ?? "").trim();
      if (!place) continue;
      if (q && !place.toLowerCase().includes(q)) continue;
      counts.set(place, (counts.get(place) ?? 0) + 1);
    }
    const list = [...counts.entries()].map(([place, count]) => ({ place, count }));
    if (list.length === 1 && list[0].place.toLowerCase() === q) return [];
    return list
      .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place))
      .slice(0, 8);
  }, [posts, query]);

  const applySuggestion = (s: { place: string }) => {
    setQuery(s.place);
    setSuggestOpen(false);
    setActiveSuggestion(-1);
  };

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setSort("newest");
    setSuggestOpen(false);
    setActiveSuggestion(-1);
    setVisibleCount(PAGE_SIZE);
  };

  const filtersAreDefault = query === "" && status === "all" && sort === "newest";

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = posts.filter((p) => {
      const matchesStatus = status === "all" || p.status === status;
      const matchesQuery = !q || (p.place_label ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
    return filtered.sort((a, b) => {
      if (sort === "place") return (a.place_label ?? "").localeCompare(b.place_label ?? "");
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === "oldest" ? -diff : diff;
    });
  }, [posts, query, status, sort]);

  // Any change to the list controls starts paging over from the first batch.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, status, sort]);

  const pagedPosts = useMemo(
    () => visiblePosts.slice(0, visibleCount),
    [visiblePosts, visibleCount],
  );
  const hasMore = visibleCount < visiblePosts.length;

  // Infinite scroll: load the next batch once the sentinel enters the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visiblePosts.length]);




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
    setBurnQuote(false);
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
        burnQuote,

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

  const statusLabel = (status: string) =>
    t(`crossways.mine.status.${status}`, {
      defaultValue:
        status === "approved" ? "Freigegeben" : status === "pending" ? "In Prüfung" : "Abgelehnt",
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("crossways.mine.hint")}</p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-[1.15rem] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSuggestOpen(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestOpen(false), 120)}
            onKeyDown={(e) => {
              if (!suggestOpen || suggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestion((i) => (i + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
              } else if (e.key === "Enter" && activeSuggestion >= 0) {
                e.preventDefault();
                applySuggestion(suggestions[activeSuggestion]);
              } else if (e.key === "Escape") {
                setSuggestOpen(false);
              }
            }}
            className="pl-9"
            role="combobox"
            aria-expanded={suggestOpen && suggestions.length > 0}
            aria-autocomplete="list"
            aria-controls="mine-place-suggestions"
            autoComplete="off"
            placeholder={t("crossways.mine.searchPlaceholder", { defaultValue: "Ort suchen …" })}
            aria-label={t("crossways.mine.searchPlaceholder", { defaultValue: "Ort suchen …" })}
          />
          {suggestOpen && suggestions.length > 0 && (
            <ul
              id="mine-place-suggestions"
              role="listbox"
              className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border/60 bg-popover shadow-md"
            >
              {suggestions.map((s, i) => (
                <li key={s.place}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeSuggestion}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    onClick={() => applySuggestion(s)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                      i === activeSuggestion ? "bg-accent text-accent-foreground" : "text-foreground"
                    }`}
                  >
                    <span className="truncate">{s.place}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{s.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label={t("crossways.mine.filterStatus", { defaultValue: "Status" })}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("crossways.mine.statusAll", { defaultValue: "Alle Status" })}</SelectItem>
            <SelectItem value="approved">{statusLabel("approved")}</SelectItem>
            <SelectItem value="pending">{statusLabel("pending")}</SelectItem>
            <SelectItem value="rejected">{statusLabel("rejected")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-48" aria-label={t("crossways.mine.sort", { defaultValue: "Sortierung" })}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("crossways.mine.sortNewest", { defaultValue: "Zuletzt hochgeladen" })}</SelectItem>
            <SelectItem value="oldest">{t("crossways.mine.sortOldest", { defaultValue: "Älteste zuerst" })}</SelectItem>
            <SelectItem value="place">{t("crossways.mine.sortPlace", { defaultValue: "Ort A–Z" })}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={filtersAreDefault}
          aria-label={t("crossways.mine.resetFilters", { defaultValue: "Filter zurücksetzen" })}
          title={t("crossways.mine.resetFilters", { defaultValue: "Filter zurücksetzen" })}
          onClick={resetFilters}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-border/60 p-8 text-center">
          <p className="text-muted-foreground">
            {t("crossways.mine.noResults", { defaultValue: "Keine Kreuze passen zu dieser Suche." })}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("crossways.mine.resultCountPaged", {
            shown: pagedPosts.length,
            count: visiblePosts.length,
            defaultValue: "{{shown}} von {{count}} Kreuzen angezeigt",
          })}
        </p>
      )}

      {pagedPosts.map((post) => (
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{post.place_label}</p>
                <Badge
                  variant={
                    post.status === "approved"
                      ? "default"
                      : post.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {statusLabel(post.status)}
                </Badge>
              </div>
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

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("crossways.mine.loadMore", { defaultValue: "Mehr laden" })}
          </Button>
        </div>
      )}




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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>{t("crossways.upload.quoteLabel")}</Label>
                <VersePicker
                  onPick={(text, reference) =>
                    setForm((f) => ({ ...f, quote: text, quoteReference: reference }))
                  }
                />
              </div>
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
