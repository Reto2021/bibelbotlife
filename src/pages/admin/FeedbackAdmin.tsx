import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ThumbsDown, ThumbsUp, Loader2, CheckCircle2, Sparkles, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type FeedbackRow = {
  id: string;
  rating: number;
  comment: string | null;
  question_text: string | null;
  answer_text: string | null;
  language: string | null;
  reviewed: boolean;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
};

type GoldenAnswer = {
  id: string;
  question: string;
  answer: string;
  language: string;
  topic: string | null;
  is_active: boolean;
  use_count: number;
  created_at: string;
};

export default function FeedbackAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [stats, setStats] = useState({ up: 0, down: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, { question: string; answer: string; topic: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [goldens, setGoldens] = useState<GoldenAnswer[]>([]);
  const [tab, setTab] = useState("queue");

  const loadFeedback = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_feedback")
      .select("*")
      .eq("rating", -1)
      .eq("reviewed", false)
      .order("created_at", { ascending: false })
      .limit(50);

    const init: Record<string, { question: string; answer: string; topic: string }> = {};
    (data || []).forEach((fb) => {
      init[fb.id] = { question: fb.question_text || "", answer: "", topic: "" };
    });
    setEditing(init);
    setFeedback((data as FeedbackRow[]) || []);

    // Stats
    const { count: upCount } = await supabase
      .from("chat_feedback")
      .select("id", { count: "exact", head: true })
      .eq("rating", 1);
    const { count: downCount } = await supabase
      .from("chat_feedback")
      .select("id", { count: "exact", head: true })
      .eq("rating", -1);
    setStats({ up: upCount || 0, down: downCount || 0 });

    setLoading(false);
  };

  const loadGoldens = async () => {
    const { data } = await supabase
      .from("golden_answers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setGoldens((data as GoldenAnswer[]) || []);
  };

  useEffect(() => {
    loadFeedback();
    loadGoldens();
  }, []);

  const markReviewed = async (id: string) => {
    const { error } = await supabase
      .from("chat_feedback")
      .update({ reviewed: true, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    setFeedback((prev) => prev.filter((f) => f.id !== id));
    toast({ title: "Als bearbeitet markiert" });
  };

  const saveGolden = async (fbId: string) => {
    const e = editing[fbId];
    if (!e || !e.question.trim() || !e.answer.trim()) {
      toast({ title: "Frage und Antwort sind nötig", variant: "destructive" });
      return;
    }
    setSaving(fbId);
    const fb = feedback.find((f) => f.id === fbId)!;

    const { data: inserted, error } = await supabase
      .from("golden_answers")
      .insert({
        question: e.question.trim(),
        answer: e.answer.trim(),
        topic: e.topic.trim() || null,
        language: fb.language || "de",
        source_feedback_id: fbId,
        created_by: user?.id,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setSaving(null);
      toast({ title: "Fehler beim Speichern", description: error?.message, variant: "destructive" });
      return;
    }

    // Embed (best-effort)
    try {
      await supabase.functions.invoke("golden-answer-embed", { body: { id: inserted.id } });
    } catch (e) {
      console.error("embed err", e);
    }

    await supabase
      .from("chat_feedback")
      .update({ reviewed: true, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", fbId);

    setSaving(null);
    setFeedback((prev) => prev.filter((f) => f.id !== fbId));
    toast({ title: "Golden Answer gespeichert ✨" });
    loadGoldens();
  };

  const toggleGolden = async (id: string, isActive: boolean) => {
    await supabase.from("golden_answers").update({ is_active: !isActive }).eq("id", id);
    loadGoldens();
  };

  const deleteGolden = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    await supabase.from("golden_answers").delete().eq("id", id);
    loadGoldens();
  };

  const reembedAll = async () => {
    toast({ title: "Embeddings werden generiert..." });
    const { data, error } = await supabase.functions.invoke("golden-answer-embed", { body: {} });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Fertig: ${(data as { updated?: number })?.updated ?? 0} Embeddings erzeugt` });
    loadGoldens();
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </Link>
        <h1 className="text-3xl font-serif">Feedback &amp; Golden Answers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schlechte Antworten reviewen, Golden Answers pflegen — der Chat lernt mit jeder Korrektur dazu.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-primary" />
          <div><div className="text-2xl font-semibold">{stats.up}</div><div className="text-xs text-muted-foreground">positiv</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-2">
          <ThumbsDown className="h-4 w-4 text-destructive" />
          <div><div className="text-2xl font-semibold">{stats.down}</div><div className="text-xs text-muted-foreground">negativ</div></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div><div className="text-2xl font-semibold">{goldens.filter((g) => g.is_active).length}</div><div className="text-xs text-muted-foreground">aktive Golden Answers</div></div>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue" className="gap-2">
            <ThumbsDown className="h-3.5 w-3.5" /> Review-Queue
            {feedback.length > 0 && <Badge variant="destructive" className="ml-1">{feedback.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="goldens" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Golden Answers ({goldens.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4 mt-4">
          {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
          {!loading && feedback.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-primary/40" />
              Keine offenen Feedbacks. 🎉
            </CardContent></Card>
          )}
          {feedback.map((fb) => {
            const e = editing[fb.id] || { question: fb.question_text || "", answer: "", topic: "" };
            return (
              <Card key={fb.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    <ThumbsDown className="h-4 w-4 text-destructive" />
                    <span>{new Date(fb.created_at).toLocaleString("de-CH")}</span>
                    {fb.language && <Badge variant="outline">{fb.language}</Badge>}
                    {fb.comment && <Badge variant="secondary">mit Kommentar</Badge>}
                    {!fb.user_id && <Badge variant="outline">anonym</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fb.comment && (
                    <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-sm">
                      <span className="font-semibold">Nutzer-Kommentar:</span> {fb.comment}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground">Frage</div>
                      <div className="rounded-md bg-muted p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">{fb.question_text || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground">Antwort (👎)</div>
                      <div className="rounded-md bg-muted p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">{fb.answer_text || "—"}</div>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Korrigierte Golden Answer
                    </div>
                    <Input
                      placeholder="Frage (kanonisch)"
                      value={e.question}
                      onChange={(ev) => setEditing((p) => ({ ...p, [fb.id]: { ...e, question: ev.target.value } }))}
                    />
                    <Textarea
                      placeholder="Bessere Antwort..."
                      rows={5}
                      value={e.answer}
                      onChange={(ev) => setEditing((p) => ({ ...p, [fb.id]: { ...e, answer: ev.target.value } }))}
                    />
                    <Input
                      placeholder="Thema (optional, z.B. Gnade, Leid, Beten)"
                      value={e.topic}
                      onChange={(ev) => setEditing((p) => ({ ...p, [fb.id]: { ...e, topic: ev.target.value } }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => markReviewed(fb.id)}>Nur als bearbeitet markieren</Button>
                    <Button onClick={() => saveGolden(fb.id)} disabled={saving === fb.id}>
                      {saving === fb.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Als Golden Answer speichern
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="goldens" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reembedAll}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Fehlende Embeddings generieren
            </Button>
          </div>
          {goldens.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
              Noch keine Golden Answers.
            </CardContent></Card>
          )}
          {goldens.map((g) => (
            <Card key={g.id} className={g.is_active ? "" : "opacity-60"}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{g.question}</div>
                    <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{g.answer}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                      {g.topic && <Badge variant="outline">{g.topic}</Badge>}
                      <Badge variant="outline">{g.language}</Badge>
                      <span>{g.use_count}× genutzt</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleGolden(g.id, g.is_active)}>
                      {g.is_active ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteGolden(g.id)} className="text-destructive">
                      Löschen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
