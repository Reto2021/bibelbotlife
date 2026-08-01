import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, ArrowLeft, Trash2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type CrossRow = {
  id: string;
  image_path: string;
  place_label: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  story: string | null;
  author_name: string | null;
  is_anonymous: boolean;
  status: string;
  rejection_reason: string | null;
  prayer_count: number;
  amen_count: number;
  share_count: number;
  reported_count: number;
  created_at: string;
};

export default function CrossModeration() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "reported" | "all">("reported");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-crosses", filter],
    queryFn: async () => {
      let q = supabase
        .from("cross_posts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (filter === "reported") {
        q = q.eq("status", "approved").gt("reported_count", 0).order("reported_count", { ascending: false });
      } else if (filter !== "all") {
        q = q.eq("status", filter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as CrossRow[];
    },
  });

  useEffect(() => {
    if (rows.length === 0) return;
    (async () => {
      const paths = rows.map((r) => r.image_path);
      const { data } = await supabase.storage
        .from("cross-photos")
        .createSignedUrls(paths, 3600);
      if (data) {
        setUrls((prev) => ({
          ...prev,
          ...Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path as string, d.signedUrl])),
        }));
      }
    })();
  }, [rows]);

  const setStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { error } = await supabase
        .from("cross_posts" as any)
        .update({
          status,
          rejection_reason: reason || null,
          moderated_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "approved" ? "Freigegeben" : "Abgelehnt" });
      qc.invalidateQueries({ queryKey: ["admin-crosses"] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (row: CrossRow) => {
      await supabase.storage.from("cross-photos").remove([row.image_path]);
      const { error } = await supabase.from("cross_posts" as any).delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Gelöscht" });
      qc.invalidateQueries({ queryKey: ["admin-crosses"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Kreuzwege-Moderation</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["reported", "pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "reported"
                ? "Gemeldet"
                : f === "pending"
                  ? "Ausstehend"
                  : f === "approved"
                    ? "Freigegeben"
                    : f === "rejected"
                      ? "Abgelehnt"
                      : "Alle"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Lade…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">Keine Einträge.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <Card key={row.id} className="overflow-hidden p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {urls[row.image_path] && (
                    <img
                      src={urls[row.image_path]}
                      alt={row.place_label}
                      className="h-40 w-full rounded-lg object-cover sm:w-56"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{row.place_label}</span>
                      {row.country && <span className="text-sm text-muted-foreground">· {row.country}</span>}
                      <Badge variant={row.status === "approved" ? "default" : "secondary"}>{row.status}</Badge>
                    </div>
                    {row.story && <p className="text-sm text-muted-foreground">{row.story}</p>}
                    <p className="text-xs text-muted-foreground">
                      {row.is_anonymous ? "Anonym" : row.author_name || "—"} ·{" "}
                      {new Date(row.created_at).toLocaleString("de-CH")}
                      {row.lat != null && ` · ${row.lat.toFixed(3)}, ${row.lng?.toFixed(3)}`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => setStatus.mutate({ id: row.id, status: "approved" })}
                        className="gap-1.5"
                      >
                        <Check className="h-4 w-4" /> Freigeben
                      </Button>
                      <Input
                        placeholder="Ablehnungsgrund"
                        className="h-9 w-48"
                        value={reasons[row.id] ?? ""}
                        onChange={(e) => setReasons((p) => ({ ...p, [row.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() =>
                          setStatus.mutate({ id: row.id, status: "rejected", reason: reasons[row.id] })
                        }
                      >
                        <X className="h-4 w-4" /> Ablehnen
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-destructive"
                        onClick={() => remove.mutate(row)}
                      >
                        <Trash2 className="h-4 w-4" /> Löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
