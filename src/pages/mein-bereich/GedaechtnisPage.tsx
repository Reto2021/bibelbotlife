import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
import { Brain, Upload, Trash2, Download, MessageSquare, FileUp, Sparkles } from "lucide-react";
import {
  useUserMemories,
  useImportMemory,
  useUpdateMemory,
  useDeleteMemory,
  type MemorySource,
} from "@/hooks/use-user-memory";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { openBibleBotChat } from "@/lib/chat-events";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


const SOURCE_LABELS: Record<MemorySource, string> = {
  gpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  manual: "Manuell",
};

const HELP_URLS: Record<Exclude<MemorySource, "manual">, string> = {
  gpt: "https://help.openai.com/en/articles/8590148-memory-faq",
  claude: "https://support.anthropic.com/en/articles/9517075-what-are-projects",
  gemini: "https://support.google.com/gemini/answer/15637730",
};

export default function GedaechtnisPage() {
  const [content, setContent] = useState("");
  const [source, setSource] = useState<MemorySource>("gpt");
  const [exporting, setExporting] = useState(false);
  const memories = useUserMemories();
  const importMem = useImportMemory();
  const updateMem = useUpdateMemory();
  const deleteMem = useDeleteMemory();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 500_000) {
      toast.error("Datei zu gross (max 500 KB)");
      return;
    }
    const text = await f.text();
    setContent(text);
  };

  const handleImport = async () => {
    if (content.trim().length < 20) {
      toast.error("Inhalt zu kurz");
      return;
    }
    await importMem.mutateAsync({ content, source });
    setContent("");
  };

  const handleExport = (mem: { content: string; source: MemorySource }) => {
    const blob = new Blob([mem.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblebot-gedaechtnis-${mem.source}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportChats = async () => {
    if (!user) {
      toast.error("Anmeldung erforderlich");
      return;
    }
    setExporting(true);
    try {
      const { data: convs, error: cErr } = await supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (cErr) throw cErr;
      if (!convs?.length) {
        toast.info("Noch keine Chats zum Exportieren");
        return;
      }
      const ids = convs.map((c) => c.id);
      const { data: msgs, error: mErr } = await supabase
        .from("chat_messages")
        .select("conversation_id, role, content, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true });
      if (mErr) throw mErr;
      const byConv = new Map<string, typeof msgs>();
      (msgs || []).forEach((m) => {
        const arr = byConv.get(m.conversation_id) || [];
        arr.push(m);
        byConv.set(m.conversation_id, arr);
      });
      const lines: string[] = [
        `# BibleBot.Life – Chat-Export`,
        `> Exportiert am ${new Date().toLocaleString("de-CH")}`,
        ``,
      ];
      for (const c of convs) {
        lines.push(`\n## ${c.title || "Unbenannt"} · ${new Date(c.created_at).toLocaleDateString("de-CH")}\n`);
        for (const m of byConv.get(c.id) || []) {
          const who = m.role === "user" ? "**Ich**" : "**BibleBot**";
          lines.push(`${who}: ${m.content}\n`);
        }
      }
      const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `biblebot-chats-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${convs.length} Chats exportiert`);
    } catch (e: any) {
      toast.error(e?.message || "Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  };

  const handleImportPrompt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 200_000) {
      toast.error("Datei zu gross (max 200 KB)");
      return;
    }
    const text = await f.text();
    if (text.trim().length < 5) {
      toast.error("Datei leer");
      return;
    }
    navigate("/");
    setTimeout(() => openBibleBotChat(text.trim().slice(0, 8000)), 200);
  };



  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SEOHead
        title="KI-Gedächtnis · BibleBot"
        description="Importiere dein Gedächtnis aus ChatGPT, Claude oder Gemini – dein Bibel-Begleiter kennt dich."
        path="/mein-bereich/gedaechtnis"
      />

      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display">Dein KI-Gedächtnis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importiere, was ChatGPT, Claude oder Gemini bereits über dich weiss.
            Dein Bibel-Begleiter nutzt es dezent, um dich persönlicher zu begleiten.
            Bleibt privat, nur du siehst es.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Neu importieren</CardTitle>
          <CardDescription>
            Kopiere den Export aus deiner KI hier rein oder lade eine .md-Datei hoch.
            Wir destillieren automatisch das Wesentliche (max 2000 Wörter).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quelle</Label>
            <RadioGroup
              value={source}
              onValueChange={(v) => setSource(v as MemorySource)}
              className="flex flex-wrap gap-4"
            >
              {(Object.keys(SOURCE_LABELS) as MemorySource[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <RadioGroupItem value={s} id={`src-${s}`} />
                  <Label htmlFor={`src-${s}`} className="font-normal cursor-pointer">
                    {SOURCE_LABELS[s]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {source !== "manual" && (
              <p className="text-xs text-muted-foreground">
                <a
                  href={HELP_URLS[source]}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-primary"
                >
                  So exportierst du dein Gedächtnis aus {SOURCE_LABELS[source]} →
                </a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Inhalt (Markdown, Text oder Kopie)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 200000))}
              placeholder="Füge hier deinen Gedächtnis-Export ein…"
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="cursor-pointer">
                <input type="file" accept=".md,.txt,.markdown" onChange={handleFile} className="hidden" />
                <span className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" /> .md-Datei laden
                </span>
              </label>
              <span className="text-xs text-muted-foreground">
                {content.length.toLocaleString()} / 200'000 Zeichen
              </span>
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={importMem.isPending || content.trim().length < 20}
            className="w-full sm:w-auto"
          >
            {importMem.isPending ? "Destilliere…" : "Importieren & destillieren"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Chats & Prompts
          </CardTitle>
          <CardDescription>
            Exportiere deine BibleBot-Chats als Markdown (portabel für andere KIs)
            oder importiere einen Prompt aus einer .md-Datei, um einen neuen Chat zu starten.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleExportChats} disabled={exporting || !user} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exportiere…" : "Chats als .md exportieren"}
          </Button>
          <label>
            <input type="file" accept=".md,.txt,.markdown" onChange={handleImportPrompt} className="hidden" />
            <span className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent cursor-pointer text-sm">
              <FileUp className="h-4 w-4" /> Prompt aus .md importieren
            </span>
          </label>
        </CardContent>
      </Card>



      <div className="space-y-3">
        <h2 className="text-lg font-medium">Gespeicherte Erinnerungen</h2>
        {memories.isLoading && <p className="text-sm text-muted-foreground">Lade…</p>}
        {memories.data?.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Noch nichts gespeichert.
          </p>
        )}
        {memories.data?.map((m) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">
                    {SOURCE_LABELS[m.source]} · {new Date(m.imported_at).toLocaleDateString("de-CH")}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={m.is_active}
                    onCheckedChange={(v) => updateMem.mutate({ id: m.id, is_active: v })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleExport(m)}
                    title="Exportieren"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Diese Erinnerung wirklich löschen?")) deleteMem.mutate(m.id);
                    }}
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto text-muted-foreground">
                {m.content}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
