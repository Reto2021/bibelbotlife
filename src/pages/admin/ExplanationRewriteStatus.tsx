import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type StatusRow = { status: string; count: number };

export function ExplanationRewriteStatus() {
  const [restarting, setRestarting] = useState(false);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["explanation-rewrite-status"],
    queryFn: async (): Promise<StatusRow[]> => {
      const { data, error } = await supabase.rpc("get_explanation_rewrite_status");
      if (error) throw error;
      return (data ?? []) as StatusRow[];
    },
    refetchInterval: 5000,
  });

  const counts = Object.fromEntries((data ?? []).map((r) => [r.status, Number(r.count)]));
  const done = counts.done ?? 0;
  const pending = counts.pending ?? 0;
  const failed = counts.failed ?? 0;
  const total = done + pending + failed;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const { error } = await supabase.functions.invoke("bible-explanations-rewrite", { body: {} });
      if (error) throw error;
      toast.success("Worker neu gestartet");
      setTimeout(() => refetch(), 1000);
    } catch (e) {
      toast.error("Start fehlgeschlagen: " + String(e));
    } finally {
      setRestarting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bibel-Erklärungen umformulieren</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Progress value={percent} />
            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{done.toLocaleString("de-CH")}</span> / {total.toLocaleString("de-CH")} fertig
                {failed > 0 && <span className="text-destructive ml-2">· {failed} Fehler</span>}
                {pending > 0 && <span className="ml-2">· {pending} offen</span>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestart}
                disabled={restarting || pending === 0}
              >
                <RotateCw className={`h-3 w-3 mr-1 ${restarting ? "animate-spin" : ""}`} />
                {pending === 0 ? "Fertig" : "Worker anstossen"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
