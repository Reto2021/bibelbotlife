import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, RefreshCw, Mail, TestTube2 } from "lucide-react";
import { toast } from "sonner";

export default function NewsletterAdmin() {
  const [optinCount, setOptinCount] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [html, setHtml] = useState(
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
  <h1 style="color:#C8883A;font-size:24px;margin:0 0 16px">Grüezi liebe BibelBot-Community</h1>
  <p style="font-size:16px;line-height:1.6">Hier kommt euer Inhalt …</p>
  <p style="font-size:16px;line-height:1.6">Herzliche Grüsse<br/>Euer BibelBot-Team</p>
</div>`,
  );
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.rpc as any)("admin_list_optin_contacts");
      setOptinCount(Array.isArray(data) ? data.length : 0);
    })();
  }, []);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("send-broadcast", {
        body: { action, ...extra },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    } finally {
      setBusy(null);
    }
  }

  async function sync() {
    try {
      const r: any = await call("sync");
      toast.success(`Audience synchronisiert: ${r.added} neu, ${r.skipped} bereits vorhanden, ${r.errors} Fehler`);
    } catch {}
  }

  async function sendTest() {
    if (!testEmail || !subject || !html) {
      toast.error("Test-Email, Betreff und Inhalt erforderlich");
      return;
    }
    try {
      await call("test", { to: testEmail, subject, html });
      toast.success(`Test-Mail an ${testEmail} gesendet`);
    } catch {}
  }

  async function sendBroadcast() {
    if (!subject || !html) {
      toast.error("Betreff und Inhalt erforderlich");
      return;
    }
    if (!confirm(`Newsletter an ${optinCount ?? "?"} Empfänger:innen senden?`)) return;
    try {
      const r: any = await call("send", { subject, html, preview });
      toast.success(`Broadcast gesendet (ID: ${r.broadcastId})`);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Zurück</Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-7 w-7" /> Newsletter
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Empfänger-Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aktuell <strong>{optinCount ?? "…"}</strong> Kontakte mit aktivem Marketing-Opt-in (nicht gesperrt).
              Versand erfolgt über <code>news@mail.biblebot.life</code> via Resend Broadcasts mit automatischem Abmelde-Link.
            </p>
            <Button onClick={sync} disabled={busy === "sync"} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${busy === "sync" ? "animate-spin" : ""}`} />
              Audience mit Opt-in-Kontakten synchronisieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Newsletter verfassen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Betreff</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z. B. BibelBot-Update Juni 2026" />
            </div>
            <div>
              <Label>Vorschautext (optional)</Label>
              <Input value={preview} onChange={(e) => setPreview(e.target.value)} placeholder="Kurzer Teaser fürs Postfach" />
            </div>
            <div>
              <Label>HTML-Inhalt</Label>
              <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={14} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground mt-1">
                Der Abmelde-Footer wird automatisch ergänzt – nicht manuell hinzufügen.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test-Versand</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Test-E-Mail-Adresse</Label>
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="du@beispiel.ch" />
            </div>
            <Button onClick={sendTest} disabled={busy === "test"} variant="outline">
              <TestTube2 className="h-4 w-4 mr-2" /> Test senden
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={sendBroadcast} disabled={busy === "send"} size="lg">
            <Send className="h-4 w-4 mr-2" />
            {busy === "send" ? "Sende …" : `An alle (${optinCount ?? "?"}) senden`}
          </Button>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6 text-sm space-y-2">
            <p className="font-semibold">DNS-Hinweis</p>
            <p className="text-muted-foreground">
              Damit der Versand funktioniert, muss <code>mail.biblebot.life</code> in Resend als <em>verified domain</em>
              angelegt sein (DKIM/SPF/DMARC-Einträge bei deinem DNS-Anbieter setzen). Die transaktionalen Mails
              (<code>notify.biblebot.life</code>) laufen separat weiter – keine Beeinträchtigung.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
