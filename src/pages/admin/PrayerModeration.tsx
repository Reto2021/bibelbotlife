import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type PrayerRow = {
  id: string;
  content: string;
  author_name: string | null;
  is_anonymous: boolean;
  is_approved: boolean;
  prayer_count: number;
  created_at: string;
};

export default function PrayerModeration() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-prayers", filter],
    queryFn: async () => {
      let q = supabase
        .from("prayer_requests")
        .select("id, content, author_name, is_anonymous, is_approved, prayer_count, created_at")
        .order("created_at", { ascending: false });

      if (filter === "pending") q = q.eq("is_approved", false);
      else if (filter === "approved") q = q.eq("is_approved", true);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PrayerRow[];
    },
  });

  const approve = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("prayer_requests")
        .update({ is_approved: approved } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      toast({ title: approved ? "✅ Freigegeben" : "❌ Abgelehnt" });
      qc.invalidateQueries({ queryKey: ["admin-prayers"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">🙏 Gebets-Moderation</h1>
        </div>

        <div className="flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "pending" ? "Ausstehend" : f === "approved" ? "Freigegeben" : "Alle"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Keine Anliegen gefunden.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{r.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{r.is_anonymous ? "Anonym" : r.author_name || "Unbenannt"}</span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString("de-CH")}</span>
                      <span>·</span>
                      <span>🙏 {r.prayer_count}</span>
                      {r.is_approved && <Badge variant="secondary" className="text-[10px]">Freigegeben</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!r.is_approved && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={() => approve.mutate({ id: r.id, approved: true })}
                        disabled={approve.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {r.is_approved && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => approve.mutate({ id: r.id, approved: false })}
                        disabled={approve.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
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