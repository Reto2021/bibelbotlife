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
  Palette, ExternalLink, Search, Rocket, Clock, Calendar,
  Instagram, Facebook, MessageCircle, Youtube,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

function useAbTestStats() {
  return useQuery({
    queryKey: ["ab-test-stats"],
    queryFn: async () => {
      const { data } = await (supabase
        .from("ab_test_events" as any)
        .select("variant, event_type") as any);
      if (!data) return { original: { views: 0, clicks: 0 }, alternative: { views: 0, clicks: 0 } };
      const stats: Record<string, { views: number; clicks: number }> = {
        original: { views: 0, clicks: 0 },
        alternative: { views: 0, clicks: 0 },
      };
      data.forEach((e: any) => {
        const v = e.variant as string;
        if (!stats[v]) stats[v] = { views: 0, clicks: 0 };
        if (e.event_type === "view") stats[v].views++;
        if (e.event_type === "cta_click") stats[v].clicks++;
      });
      return stats;
    },
  });
}

function usePipelineSchedule(campaignId: string | null) {
  return useQuery({
    queryKey: ["pipeline-schedule", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase
        .from("pipeline_schedules" as any)
        .select("*")
        .eq("campaign_id", campaignId)
        .maybeSingle();
      if (error) throw error;
      return data;
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
  const { data: abStats } = useAbTestStats();
  const { data: scheduleData, isLoading: loadingSchedule } = usePipelineSchedule(selectedCampaignId);
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

  // ─── Auto-Discover ────────────────────────────────────
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverCountry, setDiscoverCountry] = useState("ch");
  const [discoverMax, setDiscoverMax] = useState(10);
  const [discovering, setDiscovering] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<any>(null);

  const handleDiscover = async () => {
    if (!selectedCampaignId || !discoverQuery.trim()) return;
    setDiscovering(true);
    setDiscoverResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-discover", {
        body: {
          campaign_id: selectedCampaignId,
          search_query: discoverQuery,
          country: discoverCountry,
          max_results: discoverMax,
        },
      });
      if (error) throw error;
      setDiscoverResults(data);
      toast.success(`${data.imported} neue Leads importiert, ${data.skipped} Duplikate übersprungen`);
      queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Suche");
    } finally {
      setDiscovering(false);
    }
  };

  // ─── Bulk Scrape ──────────────────────────────────────
  const [bulkScrapeProgress, setBulkScrapeProgress] = useState<{ current: number; total: number; success: number; errors: number } | null>(null);

  const bulkScrape = async () => {
    const eligible = leads.filter((l: any) => l.website && !l.primary_color);
    if (!eligible.length) { toast.error("Keine Leads ohne Branding zum Scrapen"); return; }
    const progress = { current: 0, total: eligible.length, success: 0, errors: 0 };
    setBulkScrapeProgress({ ...progress });
    for (const lead of eligible) {
      progress.current++;
      setBulkScrapeProgress({ ...progress });
      try {
        const { error } = await supabase.functions.invoke("outreach-scrape", {
          body: { lead_id: lead.id, website: lead.website },
        });
        if (error) throw error;
        progress.success++;
      } catch { progress.errors++; }
      setBulkScrapeProgress({ ...progress });
      if (progress.current < progress.total) await new Promise((r) => setTimeout(r, 2000));
    }
    setBulkScrapeProgress(null);
    toast.success(`${progress.success} Websites gescraped, ${progress.errors} Fehler`);
    queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });
  };

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

  // ─── One-Click Pipeline ───────────────────────────────
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<string | null>(null);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineQuery, setPipelineQuery] = useState("");
  const [pipelineCountry, setPipelineCountry] = useState("ch");
  const [pipelineMax, setPipelineMax] = useState(10);
  const [pipelineLog, setPipelineLog] = useState<string[]>([]);

  const runPipeline = async () => {
    if (!selectedCampaignId || !pipelineQuery.trim()) return;
    setPipelineRunning(true);
    setPipelineLog([]);
    const log = (msg: string) => setPipelineLog((prev) => [...prev, msg]);

    try {
      // Step 1: Discover
      setPipelineStep("discover");
      log("🔍 Suche nach Leads…");
      const { data: discoverData, error: discoverErr } = await supabase.functions.invoke("outreach-discover", {
        body: { campaign_id: selectedCampaignId, search_query: pipelineQuery, country: pipelineCountry, max_results: pipelineMax },
      });
      if (discoverErr) throw discoverErr;
      log(`✅ ${discoverData.imported} Leads importiert, ${discoverData.skipped} Duplikate`);
      await queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });

      if (discoverData.imported === 0) {
        log("⚠️ Keine neuen Leads gefunden — Pipeline gestoppt");
        setPipelineStep(null);
        setPipelineRunning(false);
        return;
      }

      // Refetch leads
      const { data: freshLeads } = await supabase
        .from("outreach_leads")
        .select("*")
        .eq("campaign_id", selectedCampaignId)
        .order("created_at", { ascending: false });
      const allLeads = freshLeads || [];

      // Step 2: Bulk Scrape
      setPipelineStep("scrape");
      const scrapeable = allLeads.filter((l: any) => l.website && !l.primary_color);
      log(`🌐 Scrape ${scrapeable.length} Websites…`);
      let scrapeOk = 0, scrapeErr = 0;
      for (const lead of scrapeable) {
        try {
          const { error } = await supabase.functions.invoke("outreach-scrape", {
            body: { lead_id: lead.id, website: lead.website },
          });
          if (error) throw error;
          scrapeOk++;
        } catch { scrapeErr++; }
        if (scrapeOk + scrapeErr < scrapeable.length) await new Promise((r) => setTimeout(r, 2000));
      }
      log(`✅ ${scrapeOk} gescraped, ${scrapeErr} Fehler`);
      await queryClient.invalidateQueries({ queryKey: ["outreach-leads"] });

      // Step 3: Generate Sequence (if none exists)
      setPipelineStep("sequence");
      const { data: existingSeqs } = await supabase
        .from("outreach_sequences")
        .select("id")
        .eq("campaign_id", selectedCampaignId);
      if (!existingSeqs?.length) {
        log("✍️ Generiere E-Mail-Sequenz per KI…");
        const { error: seqErr } = await supabase.functions.invoke("outreach-generate-sequence", {
          body: { campaign_id: selectedCampaignId },
        });
        if (seqErr) throw seqErr;
        log("✅ Sequenz generiert");
      } else {
        log(`⏭️ Sequenz existiert bereits (${existingSeqs.length} Schritte)`);
      }
      await queryClient.invalidateQueries({ queryKey: ["outreach-sequences"] });

      // Step 4: Bulk Personalize + Send
      setPipelineStep("send");
      const eligibleLeads = allLeads.filter((l: any) => ["new"].includes(l.status));
      log(`📧 Personalisiere & sende ${eligibleLeads.length} E-Mails…`);
      let sendOk = 0, sendFail = 0;
      for (const lead of eligibleLeads) {
        try {
          const targetStep = (lead.current_step + 1) || 1;
          const { data: persData, error: persErr } = await supabase.functions.invoke("outreach-generate-sequence", {
            body: { mode: "personalize", lead_id: lead.id, step_number: targetStep },
          });
          if (persErr) throw persErr;
          const { error: insertErr } = await supabase.from("outreach_emails").insert({
            lead_id: persData.lead_id,
            sequence_step: persData.step_number,
            subject: persData.subject,
            body: persData.body,
            status: "pending" as any,
          });
          if (insertErr) throw insertErr;
          sendOk++;
        } catch { sendFail++; }
        if (sendOk + sendFail < eligibleLeads.length) await new Promise((r) => setTimeout(r, 1500));
      }
      log(`✅ ${sendOk} E-Mails vorbereitet, ${sendFail} Fehler`);

      // Trigger actual send
      const { data: sendResult, error: sendErr } = await supabase.functions.invoke("outreach-send", {});
      if (sendErr) throw sendErr;
      log(`🚀 ${sendResult.sent} E-Mails versendet!`);

      await queryClient.invalidateQueries({ queryKey: ["outreach-leads", "outreach-stats"] });
      setPipelineStep("done");
      log("🎉 Pipeline abgeschlossen!");
      toast.success("Pipeline komplett!");
    } catch (err: any) {
      log(`❌ Fehler: ${err.message || "Unbekannter Fehler"}`);
      toast.error(err.message || "Pipeline-Fehler");
    } finally {
      setPipelineRunning(false);
    }
  };

  // ─── Schedule Management ──────────────────────────────
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    search_query: "",
    country: "ch",
    max_results: 10,
    cron_expression: "0 9 * * 1-5",
    is_active: true,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const CRON_PRESETS = [
    { label: "Mo–Fr 9:00", value: "0 9 * * 1-5" },
    { label: "Täglich 9:00", value: "0 9 * * *" },
    { label: "Täglich 14:00", value: "0 14 * * *" },
    { label: "Mo & Do 9:00", value: "0 9 * * 1,4" },
    { label: "Wöchentlich Mo 9:00", value: "0 9 * * 1" },
  ];

  const openScheduleDialog = () => {
    if (scheduleData) {
      setScheduleForm({
        search_query: (scheduleData as any).search_query || "",
        country: (scheduleData as any).country || "ch",
        max_results: (scheduleData as any).max_results || 10,
        cron_expression: (scheduleData as any).cron_expression || "0 9 * * 1-5",
        is_active: (scheduleData as any).is_active ?? true,
      });
    }
    setScheduleOpen(true);
  };

  const saveSchedule = async () => {
    if (!selectedCampaignId) return;
    setSavingSchedule(true);
    try {
      if (scheduleData) {
        const { error } = await (supabase
          .from("pipeline_schedules" as any)
          .update(scheduleForm as any)
          .eq("id", (scheduleData as any).id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("pipeline_schedules" as any)
          .insert({ ...scheduleForm, campaign_id: selectedCampaignId } as any) as any);
        if (error) throw error;
      }
      toast.success("Zeitplan gespeichert");
      setScheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pipeline-schedule"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const toggleScheduleActive = async () => {
    if (!scheduleData) return;
    const newActive = !(scheduleData as any).is_active;
    await (supabase
      .from("pipeline_schedules" as any)
      .update({ is_active: newActive } as any)
      .eq("id", (scheduleData as any).id) as any);
    queryClient.invalidateQueries({ queryKey: ["pipeline-schedule"] });
    toast.success(newActive ? "Zeitplan aktiviert" : "Zeitplan deaktiviert");
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
        <div className="flex gap-2 flex-wrap">
          {/* Pipeline Button */}
          <Dialog open={pipelineOpen} onOpenChange={setPipelineOpen}>
            <DialogTrigger asChild>
              <Button variant="default" disabled={!selectedCampaignId}>
                <Rocket className="h-4 w-4 mr-2" />
                Auto-Pipeline
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>🚀 Auto-Pipeline</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Führt automatisch alle Schritte durch: Discover → Scrape → Sequenz → Senden
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Schnellsuche</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "🇨🇭 Kirchen CH", q: "reformierte katholische Kirche Gemeinde Kontakt Pfarrer", c: "ch" },
                      { label: "⛪ Freikirchen CH", q: "Freikirche evangelische Gemeinde Pastor Kontakt Schweiz", c: "ch" },
                      { label: "🏥 Spitalseelsorge", q: "Spitalseelsorge Seelsorger Spital Kontakt Schweiz", c: "ch" },
                      { label: "🙏 Seelsorger CH", q: "Seelsorge Beratung christlich Kontakt Schweiz", c: "ch" },
                      { label: "🧘 Life Coaches CH", q: "Life Coach spirituell christlich Begleitung Kontakt Schweiz", c: "ch" },
                      { label: "🏠 Heime CH", q: "Altersheim Pflegeheim Seelsorge Kontakt Schweiz", c: "ch" },
                    ].map((p) => (
                      <Button key={p.label} variant="outline" size="sm" className="text-xs h-7"
                        onClick={() => { setPipelineQuery(p.q); setPipelineCountry(p.c); }}>
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Suchbegriff</Label>
                  <Input value={pipelineQuery} onChange={(e) => setPipelineQuery(e.target.value)}
                    placeholder='z.B. "reformierte Kirche Zürich Kontakt"' />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Land</Label><Input value={pipelineCountry} onChange={(e) => setPipelineCountry(e.target.value)} placeholder="ch" /></div>
                  <div><Label>Max. Leads</Label><Input type="number" min={1} max={20} value={pipelineMax} onChange={(e) => setPipelineMax(Number(e.target.value))} /></div>
                </div>

                {/* Pipeline Stepper + Progress */}
                {(pipelineRunning || pipelineStep === "done") && (
                  <div className="space-y-3">
                    {/* Step indicators */}
                    <div className="flex items-center gap-1">
                      {[
                        { key: "discover", label: "Discover", icon: "🔍", num: 1 },
                        { key: "scrape", label: "Scrape", icon: "🌐", num: 2 },
                        { key: "sequence", label: "Sequenz", icon: "✍️", num: 3 },
                        { key: "send", label: "Senden", icon: "🚀", num: 4 },
                      ].map((s, i) => {
                        const stepOrder = ["discover", "scrape", "sequence", "send"];
                        const currentIdx = pipelineStep ? stepOrder.indexOf(pipelineStep) : -1;
                        const thisIdx = stepOrder.indexOf(s.key);
                        const isDone = pipelineStep === "done" || thisIdx < currentIdx;
                        const isActive = s.key === pipelineStep && pipelineStep !== "done";
                        return (
                          <div key={s.key} className="flex items-center flex-1">
                            <div className={`flex flex-col items-center flex-1 ${isActive ? "scale-105" : ""}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                                isDone ? "bg-primary text-primary-foreground" :
                                isActive ? "bg-primary/20 text-primary ring-2 ring-primary animate-pulse" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {isDone ? "✓" : s.icon}
                              </div>
                              <span className={`text-[10px] mt-1 ${isActive ? "font-semibold text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                                {s.label}
                              </span>
                            </div>
                            {i < 3 && (
                              <div className={`h-0.5 w-full mx-1 mt-[-12px] rounded transition-all duration-500 ${
                                thisIdx < currentIdx || pipelineStep === "done" ? "bg-primary" : "bg-border"
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Overall progress bar */}
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: pipelineStep === "done" ? "100%" :
                            pipelineStep === "send" ? "87%" :
                            pipelineStep === "sequence" ? "62%" :
                            pipelineStep === "scrape" ? "37%" :
                            pipelineStep === "discover" ? "12%" : "0%",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Pipeline Log */}
                {pipelineLog.length > 0 && (
                  <Card className="bg-muted/50 max-h-48 overflow-y-auto">
                    <CardContent className="p-3 space-y-1">
                      {pipelineLog.map((line, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{line}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button onClick={runPipeline} disabled={pipelineRunning || !pipelineQuery.trim()}
                  className="w-full">
                  {pipelineRunning ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Pipeline läuft…</>
                  ) : (
                    <><Rocket className="h-4 w-4 mr-2" />Pipeline starten</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Schedule Button */}
          <Button
            variant={scheduleData && (scheduleData as any).is_active ? "default" : "outline"}
            disabled={!selectedCampaignId}
            onClick={openScheduleDialog}
            className="relative"
          >
            <Clock className="h-4 w-4 mr-2" />
            Zeitplan
            {scheduleData && (scheduleData as any).is_active && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </Button>

          {/* Schedule Dialog */}
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>⏰ Pipeline-Zeitplan</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Führt die Pipeline automatisch nach Zeitplan aus (Discover → Scrape → Sequenz → Senden).
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Zeitplan aktiv
                  </Label>
                  <Switch
                    checked={scheduleForm.is_active}
                    onCheckedChange={(v) => setScheduleForm({ ...scheduleForm, is_active: v })}
                  />
                </div>

                <div>
                  <Label>Ausführungszeit</Label>
                  <Select
                    value={scheduleForm.cron_expression}
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, cron_expression: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CRON_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Schnellsuche</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "🇨🇭 Kirchen CH", q: "reformierte katholische Kirche Gemeinde Kontakt Pfarrer", c: "ch" },
                      { label: "🏥 Spitalseelsorge", q: "Spitalseelsorge Seelsorger Spital Kontakt Schweiz", c: "ch" },
                      { label: "🙏 Seelsorger CH", q: "Seelsorge Beratung christlich Kontakt Schweiz", c: "ch" },
                      { label: "🧘 Life Coaches CH", q: "Life Coach spirituell christlich Begleitung Kontakt Schweiz", c: "ch" },
                    ].map((p) => (
                      <Button key={p.label} variant="outline" size="sm" className="text-xs h-7"
                        onClick={() => { setScheduleForm({ ...scheduleForm, search_query: p.q, country: p.c }); }}>
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Suchbegriff</Label>
                  <Input
                    value={scheduleForm.search_query}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, search_query: e.target.value })}
                    placeholder='z.B. "reformierte Kirche Zürich Kontakt"'
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Land</Label>
                    <Input value={scheduleForm.country} onChange={(e) => setScheduleForm({ ...scheduleForm, country: e.target.value })} placeholder="ch" />
                  </div>
                  <div>
                    <Label>Max. Leads</Label>
                    <Input type="number" min={1} max={20} value={scheduleForm.max_results}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, max_results: Number(e.target.value) })} />
                  </div>
                </div>

                {/* Last run info */}
                {scheduleData && (scheduleData as any).last_run_at && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Letzter Lauf</span>
                        <Badge variant={(scheduleData as any).last_run_status === "success" ? "default" : "destructive"}>
                          {(scheduleData as any).last_run_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date((scheduleData as any).last_run_at).toLocaleString("de-CH")}
                      </p>
                      {(scheduleData as any).last_run_log?.slice(-5).map((line: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">{line}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                {scheduleData && (
                  <Button variant="outline" onClick={toggleScheduleActive}>
                    {(scheduleData as any).is_active ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {(scheduleData as any).is_active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                )}
                <Button onClick={saveSchedule} disabled={savingSchedule || !scheduleForm.search_query.trim()}>
                  {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                  Zeitplan speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
            <TabsTrigger value="ab-test"><Palette className="h-4 w-4 mr-1" />A/B-Test</TabsTrigger>
          </TabsList>

          {/* ─── Leads Tab ──────────────────────── */}
          <TabsContent value="leads" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {/* Auto-Discover */}
              <Dialog open={discoverOpen} onOpenChange={setDiscoverOpen}>
                <DialogTrigger asChild>
                  <Button><Search className="h-4 w-4 mr-2" />Auto-Discover</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>🔍 Kirchen automatisch finden</DialogTitle></DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Sucht im Web nach Kirchen-Websites, extrahiert E-Mail-Kontakte per KI und importiert sie als Leads.
                  </p>
                  <div className="space-y-3">
                    {/* Preset Search Categories */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Schnellsuche</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "🇨🇭 Schweiz", q: "reformierte Kirche Kirchgemeinde Pfarramt Schweiz Kontakt", country: "ch" },
                          { label: "🏛️ Kirchen CH", q: "reformierte katholische Kirche Gemeinde Kontakt Pfarrer", country: "ch" },
                          { label: "⛪ Freikirchen CH", q: "Freikirche evangelische Gemeinde Pastor Kontakt Schweiz", country: "ch" },
                          { label: "🏥 Spitalseelsorge CH", q: "Spitalseelsorge Seelsorger Spital Kontakt Schweiz", country: "ch" },
                          { label: "🏠 Heime CH", q: "Altersheim Pflegeheim Seelsorge Kontakt Schweiz", country: "ch" },
                          { label: "🙏 Seelsorger CH", q: "Seelsorge Beratung christlich Kontakt Schweiz", country: "ch" },
                          { label: "🧘 Life Coaches CH", q: "Life Coach spirituell christlich Begleitung Kontakt Schweiz", country: "ch" },
                          { label: "🇦🇹 Österreich", q: "evangelische Pfarrgemeinde Österreich Kontakt", country: "at" },
                          { label: "🇩🇪 Deutschland", q: "evangelische Kirchengemeinde Deutschland Kontakt Pfarrer", country: "de" },
                        ].map((preset) => (
                          <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => { setDiscoverQuery(preset.q); setDiscoverCountry(preset.country); }}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Suchbegriff</Label>
                      <Input
                        value={discoverQuery}
                        onChange={(e) => setDiscoverQuery(e.target.value)}
                        placeholder='z.B. "reformierte Kirche Zürich Kontakt" oder "Spitalseelsorge Bern"'
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Land</Label>
                        <Input value={discoverCountry} onChange={(e) => setDiscoverCountry(e.target.value)} placeholder="ch, de, at…" />
                      </div>
                      <div>
                        <Label>Max. Ergebnisse</Label>
                        <Input type="number" min={1} max={20} value={discoverMax} onChange={(e) => setDiscoverMax(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                  {discoverResults && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-3 text-sm space-y-1">
                        <p>✅ <strong>{discoverResults.imported}</strong> neue Leads importiert</p>
                        <p>⏭️ <strong>{discoverResults.skipped}</strong> Duplikate übersprungen</p>
                        <p>📭 <strong>{discoverResults.no_email}</strong> ohne E-Mail</p>
                        <p>🔎 <strong>{discoverResults.discovered}</strong> Websites analysiert</p>
                      </CardContent>
                    </Card>
                  )}
                  <DialogFooter>
                    <Button onClick={handleDiscover} disabled={discovering || !discoverQuery.trim()}>
                      {discovering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      {discovering ? "Suche läuft…" : "Suchen & importieren"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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

              {/* Bulk Scrape */}
              <Button
                variant="outline"
                onClick={bulkScrape}
                disabled={!!bulkScrapeProgress || leads.filter((l: any) => l.website && !l.primary_color).length === 0}
              >
                {bulkScrapeProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Scrape {bulkScrapeProgress.current}/{bulkScrapeProgress.total}
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Alle scrapen ({leads.filter((l: any) => l.website && !l.primary_color).length})
                  </>
                )}
              </Button>

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

            {bulkScrapeProgress && (
              <div className="space-y-1">
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkScrapeProgress.current / bulkScrapeProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scrape Website {bulkScrapeProgress.current} von {bulkScrapeProgress.total}…
                  {bulkScrapeProgress.errors > 0 && <span className="text-destructive ml-1">({bulkScrapeProgress.errors} Fehler)</span>}
                </p>
              </div>
            )}

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
                        <TableHead>Score</TableHead>
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
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {lead.primary_color && (
                                  <div className="w-3 h-3 rounded-full border" style={{ background: lead.primary_color }} />
                                )}
                                {lead.church_name}
                              </div>
                            </TableCell>
                            <TableCell>{lead.contact_name || "–"}</TableCell>
                            <TableCell className="text-sm">{lead.email}</TableCell>
                            <TableCell>{lead.city || "–"}</TableCell>
                            <TableCell>
                              {lead.website_score != null ? (
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  lead.website_score >= 7 ? "bg-green-100 text-green-800" :
                                  lead.website_score >= 5 ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }`}>{lead.website_score}/10</span>
                              ) : "–"}
                            </TableCell>
                            <TableCell>{lead.current_step}/{sequences.length}</TableCell>
                            <TableCell><Badge variant={ls.variant}>{ls.label}</Badge></TableCell>
                            <TableCell className="text-right space-x-1">
                              {lead.primary_color && (
                                <Button
                                  variant="ghost" size="icon" asChild
                                  title="Widget-Vorschau"
                                >
                                  <a href={`/widget-preview/${lead.id}`} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
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
                      Platzhalter: {"{{church_name}}, {{contact_name}}, {{city}}, {{denomination}}, {{personal_note}}, {{booking_url}}, {{sender_name}}, {{previewUrl}}, {{screenshotUrl}}, {{splashUrl}}, {{websiteScore}}, {{primaryColor}}"}
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

          {/* ─── A/B Test Tab ──────────────────── */}
          <TabsContent value="ab-test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  A/B-Test: Widget-Farbvarianten
                </CardTitle>
                <CardDescription>
                  Vergleich der Original-Farben vs. optimierte Alternative bei Widget-Previews
                </CardDescription>
              </CardHeader>
              <CardContent>
                {abStats ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {(["original", "alternative"] as const).map((v) => {
                      const s = (abStats as any)[v] || { views: 0, clicks: 0 };
                      const rate = s.views > 0 ? ((s.clicks / s.views) * 100).toFixed(1) : "0.0";
                      return (
                        <Card key={v} className="border-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base capitalize">{v === "original" ? "🎨 Original" : "✨ Alternative (+15° Hue)"}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Views</span>
                              <span className="font-medium">{s.views}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">CTA-Klicks</span>
                              <span className="font-medium">{s.clicks}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                              <span className="text-muted-foreground font-medium">Conversion Rate</span>
                              <span className="font-bold text-primary">{rate}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Noch keine A/B-Test-Daten vorhanden</p>
                )}
              </CardContent>
            </Card>

            {/* Leads with branding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads mit Branding-Daten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gemeinde</TableHead>
                      <TableHead>Farben</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.filter((l: any) => l.primary_color).map((lead: any) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.church_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded border" style={{ background: lead.primary_color }} title="Original" />
                            {lead.ab_variant_color && (
                              <div className="w-5 h-5 rounded border" style={{ background: lead.ab_variant_color }} title="Alternative" />
                            )}
                            {lead.secondary_color && (
                              <div className="w-5 h-5 rounded border" style={{ background: lead.secondary_color }} title="Secondary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{lead.website_score ?? "–"}/10</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/widget-preview/${lead.id}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />Öffnen
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {leads.filter((l: any) => l.primary_color).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          Noch keine Leads mit Branding-Daten. Scrape zuerst Websites.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ─── Personalized Email Preview/Edit Dialog ─── */}
      <Dialog open={personalizePreviewOpen} onOpenChange={setPersonalizePreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Personalisierte E-Mail – Vorschau & Bearbeitung
            </DialogTitle>
          </DialogHeader>
          {personalizedEmail && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Betreff</Label>
                <Input
                  value={personalizedEmail.subject}
                  onChange={(e) => setPersonalizedEmail({ ...personalizedEmail, subject: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-Mail-Text (HTML)</Label>
                <Textarea
                  value={personalizedEmail.body}
                  onChange={(e) => setPersonalizedEmail({ ...personalizedEmail, body: e.target.value })}
                  rows={12}
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Vorschau</Label>
                <div
                  className="border rounded-lg p-4 bg-card text-sm prose prose-sm max-w-none"
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
