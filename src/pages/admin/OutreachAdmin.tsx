import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Play, Pause, Upload, Globe, Mail, Users, BarChart3,
  Loader2, Trash2, RefreshCw, Send, Target, Sparkles, Wand2, Eye, Copy,
} from "lucide-react";

// ─── Hooks ───────────────────────────────────────────────
function useCampaigns() {
  return useQuery({
    queryKey: ["outreach-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outreach_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useLeads(campaignId: string | null) {
  return useQuery({
    queryKey: ["outreach-leads", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("outreach_leads")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!campaignId,
  });
}

function useSequences(campaignId: string | null) {
  return useQuery({
    queryKey: ["outreach-sequences", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("outreach_sequences")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("step_number");
      if (error) throw error;
      return data || [];
    },
    enabled: !!campaignId,
  });
}

function useOutreachStats(campaignId: string | null) {
  return useQuery({
    queryKey: ["outreach-stats", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data: leads } = await supabase
        .from("outreach_leads")
        .select("status")
        .eq("campaign_id", campaignId);
      const { data: emails } = await supabase
        .from("outreach_emails")
        .select("status")
        .in("lead_id",
          (await supabase.from("outreach_leads").select("id").eq("campaign_id", campaignId)).data?.map((l: any) => l.id) || []
        );
      const statusCounts: Record<string, number> = {};
      leads?.forEach((l: any) => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });
      const emailCounts: Record<string, number> = {};
      emails?.forEach((e: any) => { emailCounts[e.status] = (emailCounts[e.status] || 0) + 1; });
      return {
        totalLeads: leads?.length || 0,
        leadStatus: statusCounts,
        totalEmails: emails?.length || 0,
        emailStatus: emailCounts,
      };
    },
    enabled: !!campaignId,
  });
}

// ─── Status badges ───────────────────────────────────────
const LEAD_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Neu", variant: "outline" },
  contacted: { label: "Kontaktiert", variant: "secondary" },
  replied: { label: "Geantwortet", variant: "default" },
  booked: { label: "Gebucht", variant: "default" },
  converted: { label: "Konvertiert", variant: "default" },
  unsubscribed: { label: "Abgemeldet", variant: "destructive" },
};

const CAMPAIGN_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Aktiv", variant: "default" },
  paused: { label: "Pausiert", variant: "secondary" },
  completed: { label: "Abgeschlossen", variant: "outline" },
};

// ─── Main Component ──────────────────────────────────────
export default function OutreachAdmin() {
  const queryClient = useQueryClient();
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);

  const selectedCampaign = campaigns.find((c: any) => c.id === selectedCampaignId);
  const { data: leads = [], isLoading: loadingLeads } = useLeads(selectedCampaignId);
  const { data: sequences = [] } = useSequences(selectedCampaignId);
  const { data: stats } = useOutreachStats(selectedCampaignId);

  // ─── Campaign CRUD ─────────────────────────────────────
  const [campaignForm, setCampaignForm] = useState({
    name: "", sender_name: "BibleBot.Life", sender_email: "",
    booking_url: "", max_emails_per_day: 50, max_emails_per_hour: 10,
  });

  const createCampaign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("outreach_campaigns").insert({
      ...campaignForm,
      created_by: user.id,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Kampagne erstellt");
    setNewCampaignOpen(false);
    queryClient.invalidateQueries({ queryKey: ["outreach-campaigns"] });
  };

  const toggleCampaign = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await supabase.from("outreach_campaigns").update({ status: newStatus } as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["outreach-campaigns"] });
    toast.success(newStatus === "active" ? "Kampagne gestartet" : "Kampagne pausiert");
  };

  // ─── CSV Import ────────────────────────────────────────
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!selectedCampaignId || !csvText.trim()) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-import", {
        body: { campaign_id: selectedCampaignId, csv_data: csvText },
      });
      if (error) throw error;
      toast.success(`${data.imported} Leads importiert, ${data.skipped} übersprungen`);
      setCsvText("");
      setImportOpen(false);
      queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  // ─── Scrape Lead ───────────────────────────────────────
  const [scraping, setScraping] = useState<string | null>(null);

  const scrapeLead = async (lead: any) => {
    if (!lead.website) { toast.error("Keine Website hinterlegt"); return; }
    setScraping(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-scrape", {
        body: { lead_id: lead.id, website: lead.website },
      });
      if (error) throw error;
      toast.success("Lead angereichert");
      queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setScraping(null);
    }
  };

  // ─── Sequence Editor ───────────────────────────────────
  const [seqForm, setSeqForm] = useState({
    step_number: 1, delay_days: 3, subject_template: "", body_template: "",
  });

  const saveSequence = async () => {
    if (!selectedCampaignId) return;
    const existing = sequences.find((s: any) => s.step_number === seqForm.step_number);
    if (existing) {
      await supabase.from("outreach_sequences")
        .update({ ...seqForm } as any)
        .eq("id", existing.id);
    } else {
      await supabase.from("outreach_sequences").insert({
        campaign_id: selectedCampaignId, ...seqForm,
      } as any);
    }
    toast.success(`Schritt ${seqForm.step_number} gespeichert`);
    queryClient.invalidateQueries({ queryKey: ["outreach-sequences"] });
    setSequenceOpen(false);
  };

  // ─── Manual Send Trigger ───────────────────────────────
  const [sending, setSending] = useState(false);
  const triggerSend = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-send", {});
      if (error) throw error;
      toast.success(`${data.sent} E-Mails versendet`);
      queryClient.invalidateQueries({ queryKey: ["outreach-leads", "outreach-stats"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  // ─── KI Sequenz generieren ─────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [genContext, setGenContext] = useState("");
  const [genDialogOpen, setGenDialogOpen] = useState(false);

  const generateSequence = async () => {
    if (!selectedCampaignId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-generate-sequence", {
        body: { campaign_id: selectedCampaignId, context: genContext || undefined },
      });
      if (error) throw error;
      toast.success(data.message || "Sequenz generiert!");
      setGenDialogOpen(false);
      setGenContext("");
      queryClient.invalidateQueries({ queryKey: ["outreach-sequences"] });
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Generierung");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Per-Lead personalisierte E-Mail ──────────────────
  const [personalizingLead, setPersonalizingLead] = useState<string | null>(null);
  const [personalizedEmail, setPersonalizedEmail] = useState<{ lead_id: string; step_number: number; subject: string; body: string } | null>(null);
  const [personalizePreviewOpen, setPersonalizePreviewOpen] = useState(false);
  const [savingPersonalized, setSavingPersonalized] = useState(false);

  // ─── Bulk Personalisierung ────────────────────────────
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; success: number; errors: number } | null>(null);

  const generatePersonalizedEmail = async (lead: any, stepNumber?: number) => {
    setPersonalizingLead(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-generate-sequence", {
        body: {
          mode: "personalize",
          lead_id: lead.id,
          step_number: stepNumber || undefined,
        },
      });
      if (error) throw error;
      setPersonalizedEmail(data);
      setPersonalizePreviewOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Personalisierung");
    } finally {
      setPersonalizingLead(null);
    }
  };

  const bulkPersonalize = async (stepNumber?: number) => {
    if (!selectedCampaignId || leads.length === 0) return;

    // Filter leads that are "new" or "contacted" (skip converted/unsubscribed)
    const eligibleLeads = leads.filter((l: any) => ["new", "contacted"].includes(l.status));
    if (eligibleLeads.length === 0) {
      toast.error("Keine offenen Leads zum Personalisieren");
      return;
    }

    const progress = { current: 0, total: eligibleLeads.length, success: 0, errors: 0 };
    setBulkProgress({ ...progress });

    for (const lead of eligibleLeads) {
      progress.current++;
      setBulkProgress({ ...progress });

      try {
        const targetStep = stepNumber || (lead.current_step + 1) || 1;
        const { data, error } = await supabase.functions.invoke("outreach-generate-sequence", {
          body: { mode: "personalize", lead_id: lead.id, step_number: targetStep },
        });
        if (error) throw error;

        // Auto-save the personalized email
        const { error: insertErr } = await supabase.from("outreach_emails").insert({
          lead_id: data.lead_id,
          sequence_step: data.step_number,
          subject: data.subject,
          body: data.body,
          status: "pending" as any,
        });
        if (insertErr) throw insertErr;

        progress.success++;
      } catch (err: any) {
        console.error(`Bulk personalize error for ${lead.church_name}:`, err);
        progress.errors++;
      }

      setBulkProgress({ ...progress });

      // Small delay to avoid rate limits
      if (progress.current < progress.total) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setBulkProgress(null);
    toast.success(`${progress.success} E-Mails personalisiert, ${progress.errors} Fehler`);
    queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });
    queryClient.invalidateQueries({ queryKey: ["outreach-stats"] });
  };

  const savePersonalizedEmail = async () => {
    if (!personalizedEmail) return;
    setSavingPersonalized(true);
    try {
      const { error } = await supabase.from("outreach_emails").insert({
        lead_id: personalizedEmail.lead_id,
        sequence_step: personalizedEmail.step_number,
        subject: personalizedEmail.subject,
        body: personalizedEmail.body,
        status: "pending" as any,
      });
      if (error) throw error;
      toast.success("Personalisierte E-Mail gespeichert (bereit zum Senden)");
      setPersonalizePreviewOpen(false);
      setPersonalizedEmail(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPersonalized(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Cold Outreach
          </h1>
          <p className="text-muted-foreground">Lead-Generierung & E-Mail-Sequenzen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={triggerSend} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Jetzt senden
          </Button>
          <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Neue Kampagne</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neue Kampagne</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="z.B. Schweizer Gemeinden Q2" /></div>
                <div><Label>Absender Name</Label><Input value={campaignForm.sender_name} onChange={(e) => setCampaignForm({ ...campaignForm, sender_name: e.target.value })} /></div>
                <div><Label>Absender E-Mail</Label><Input type="email" value={campaignForm.sender_email} onChange={(e) => setCampaignForm({ ...campaignForm, sender_email: e.target.value })} placeholder="outreach@deinedomain.ch" /></div>
                <div><Label>Buchungslink (10-Min-Demo)</Label><Input value={campaignForm.booking_url} onChange={(e) => setCampaignForm({ ...campaignForm, booking_url: e.target.value })} placeholder="https://cal.com/..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Max. E-Mails/Tag</Label><Input type="number" value={campaignForm.max_emails_per_day} onChange={(e) => setCampaignForm({ ...campaignForm, max_emails_per_day: Number(e.target.value) })} /></div>
                  <div><Label>Max. E-Mails/Stunde</Label><Input type="number" value={campaignForm.max_emails_per_hour} onChange={(e) => setCampaignForm({ ...campaignForm, max_emails_per_hour: Number(e.target.value) })} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={createCampaign} disabled={!campaignForm.name || !campaignForm.sender_email}>Erstellen</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingCampaigns && <div className="col-span-full text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
        {campaigns.map((c: any) => {
          const st = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.paused;
          const isSelected = c.id === selectedCampaignId;
          return (
            <Card
              key={c.id}
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => setSelectedCampaignId(c.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <CardDescription>{c.sender_email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max {c.max_emails_per_day}/Tag</span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={(e) => { e.stopPropagation(); toggleCampaign(c.id, c.status); }}
                  >
                    {c.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Detail */}
      {selectedCampaignId && (
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads"><Users className="h-4 w-4 mr-1" />Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="sequences"><Mail className="h-4 w-4 mr-1" />Sequenzen ({sequences.length})</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" />Statistiken</TabsTrigger>
          </TabsList>

          {/* ─── Leads Tab ──────────────────────── */}
          <TabsContent value="leads" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Upload className="h-4 w-4 mr-2" />CSV Import</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Leads importieren (CSV)</DialogTitle></DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Kopiere CSV mit Spalten: <code>church_name,email,website,city,denomination,contact_name</code>
                  </p>
                  <Textarea
                    rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)}
                    placeholder="church_name,email,website,city,denomination,contact_name&#10;Ref. Kirche Zürich,pfarrer@refzh.ch,https://refzh.ch,Zürich,reformiert,Hans Müller"
                  />
                  <DialogFooter>
                    <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
                      {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Importieren
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => bulkPersonalize()}
                disabled={!!bulkProgress || leads.length === 0}
              >
                {bulkProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {bulkProgress.current}/{bulkProgress.total} ({bulkProgress.success} ✓ {bulkProgress.errors > 0 ? `, ${bulkProgress.errors} ✗` : ""})
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Alle personalisieren
                  </>
                )}
              </Button>
            </div>

            {bulkProgress && (
              <div className="space-y-1">
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Personalisiere Lead {bulkProgress.current} von {bulkProgress.total}…
                  {bulkProgress.errors > 0 && <span className="text-destructive ml-1">({bulkProgress.errors} Fehler)</span>}
                </p>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                {loadingLeads ? (
                  <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Noch keine Leads – importiere welche via CSV</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gemeinde</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Stadt</TableHead>
                        <TableHead>Schritt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead: any) => {
                        const ls = LEAD_STATUS[lead.status] || LEAD_STATUS.new;
                        return (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.church_name}</TableCell>
                            <TableCell>{lead.contact_name || "–"}</TableCell>
                            <TableCell className="text-sm">{lead.email}</TableCell>
                            <TableCell>{lead.city || "–"}</TableCell>
                            <TableCell>{lead.current_step}/{sequences.length}</TableCell>
                            <TableCell><Badge variant={ls.variant}>{ls.label}</Badge></TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost" size="icon"
                                onClick={() => generatePersonalizedEmail(lead)}
                                disabled={personalizingLead === lead.id}
                                title="KI-personalisierte E-Mail generieren"
                              >
                                {personalizingLead === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                              </Button>
                              {lead.website && (
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => scrapeLead(lead)}
                                  disabled={scraping === lead.id}
                                  title="Website scrapen & anreichern"
                                >
                                  {scraping === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Sequences Tab ──────────────────── */}
          <TabsContent value="sequences" className="space-y-4">
            <div className="flex gap-2">
              <Dialog open={sequenceOpen} onOpenChange={setSequenceOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Schritt hinzufügen</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Sequenz-Schritt bearbeiten</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Schritt Nr.</Label><Input type="number" min={1} max={5} value={seqForm.step_number} onChange={(e) => setSeqForm({ ...seqForm, step_number: Number(e.target.value) })} /></div>
                      <div><Label>Wartezeit (Tage)</Label><Input type="number" min={0} value={seqForm.delay_days} onChange={(e) => setSeqForm({ ...seqForm, delay_days: Number(e.target.value) })} /></div>
                    </div>
                    <div>
                      <Label>Betreff</Label>
                      <Input value={seqForm.subject_template} onChange={(e) => setSeqForm({ ...seqForm, subject_template: e.target.value })} placeholder="Hallo {{contact_name}} – kurze Frage zu {{church_name}}" />
                    </div>
                    <div>
                      <Label>E-Mail-Text (HTML)</Label>
                      <Textarea
                        rows={10} value={seqForm.body_template}
                        onChange={(e) => setSeqForm({ ...seqForm, body_template: e.target.value })}
                        placeholder="<p>Liebe/r {{contact_name}},</p>&#10;<p>{{personal_note}}</p>&#10;<p>Darf ich Ihnen in 10 Minuten zeigen, wie BibleBot.Life Ihrer Gemeinde helfen kann?</p>&#10;<p><a href='{{booking_url}}'>Termin buchen</a></p>"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Platzhalter: {"{{church_name}}, {{contact_name}}, {{city}}, {{denomination}}, {{personal_note}}, {{booking_url}}, {{sender_name}}"}
                    </p>
                  </div>
                  <DialogFooter><Button onClick={saveSequence}>Speichern</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Sparkles className="h-4 w-4 mr-2" />KI-Sequenz generieren</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>KI-gestützte Sequenz generieren</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Die KI erstellt eine psychologisch optimierte 5-Schritt-E-Mail-Sequenz basierend auf deiner Kampagne. Bestehende Schritte werden ersetzt.
                  </p>
                  <div>
                    <Label>Zusätzlicher Kontext (optional)</Label>
                    <Textarea
                      rows={4}
                      value={genContext}
                      onChange={(e) => setGenContext(e.target.value)}
                      placeholder="z.B. Fokus auf reformierte Gemeinden in der Deutschschweiz, betone den kostenlosen Testmonat..."
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={generateSequence} disabled={generating}>
                      {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      {generating ? "Generiere..." : "Sequenz generieren"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {sequences.length === 0 && (
                <Card><CardContent className="text-center py-8 text-muted-foreground">Noch keine Sequenz-Schritte definiert</CardContent></Card>
              )}
              {sequences.map((seq: any) => (
                <Card key={seq.id} className="cursor-pointer hover:shadow-md" onClick={() => {
                  setSeqForm({
                    step_number: seq.step_number,
                    delay_days: seq.delay_days,
                    subject_template: seq.subject_template,
                    body_template: seq.body_template,
                  });
                  setSequenceOpen(true);
                }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Schritt {seq.step_number}</CardTitle>
                      <Badge variant="outline">{seq.delay_days} Tage Wartezeit</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{seq.subject_template}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{seq.body_template.replace(/<[^>]*>/g, "").slice(0, 120)}...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── Stats Tab ──────────────────────── */}
          <TabsContent value="stats">
            {stats ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="pb-2"><CardDescription>Total Leads</CardDescription><CardTitle className="text-2xl">{stats.totalLeads}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>E-Mails gesendet</CardDescription><CardTitle className="text-2xl">{stats.emailStatus.sent || 0}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Geantwortet</CardDescription><CardTitle className="text-2xl text-secondary">{stats.leadStatus.replied || 0}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Demo gebucht</CardDescription><CardTitle className="text-2xl text-primary">{stats.leadStatus.booked || 0}</CardTitle></CardHeader></Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Wähle eine Kampagne</div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ─── Personalized Email Preview Dialog ─── */}
      <Dialog open={personalizePreviewOpen} onOpenChange={setPersonalizePreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Personalisierte E-Mail – Vorschau
            </DialogTitle>
          </DialogHeader>
          {personalizedEmail && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Betreff</Label>
                <p className="font-medium text-foreground">{personalizedEmail.subject}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-Mail-Text</Label>
                <div
                  className="mt-1 border rounded-lg p-4 bg-card text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: personalizedEmail.body }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Schritt {personalizedEmail.step_number} • Lead: {personalizedEmail.lead_id.slice(0, 8)}…
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              if (personalizedEmail) generatePersonalizedEmail({ id: personalizedEmail.lead_id }, personalizedEmail.step_number);
            }} disabled={!!personalizingLead}>
              {personalizingLead ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Neu generieren
            </Button>
            <Button onClick={savePersonalizedEmail} disabled={savingPersonalized}>
              {savingPersonalized ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Als E-Mail speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
