import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Download, Loader2, Save, Share2,
  Check, Copy, ExternalLink, Music, BookOpenText, HandHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCeremonyDrafts } from "@/hooks/use-ceremony-drafts";
import { useResources } from "@/hooks/use-resources";
import jsPDF from "jspdf";

// ──────────────────────────────────────────────
// Config per ceremony type
// ──────────────────────────────────────────────
export interface CeremonyField {
  key: string;
  labelKey: string;
  placeholder: string;
  type?: "text" | "date" | "select";
  options?: { value: string; label: string }[];
}

export interface CeremonyConfig {
  type: "wedding" | "baptism" | "confirmation";
  edgeFnType: string; // maps to ceremony-writer edge fn
  titleKey: string;
  subtitleKey: string;
  seoTitleKey: string;
  seoDescKey: string;
  seoPath: string;
  fields: CeremonyField[];
  notesPlaceholder: string;
  generateLabel: string;
  pdfTitle: (fd: Record<string, string>) => string;
  pdfFileName: (fd: Record<string, string>) => string;
  suggestedTags: string[]; // for resource suggestions
}

// ──────────────────────────────────────────────
// Configs
// ──────────────────────────────────────────────

export const WEDDING_CONFIG: CeremonyConfig = {
  type: "wedding",
  edgeFnType: "wedding",
  titleKey: "ceremony.wedding.title",
  subtitleKey: "ceremony.wedding.subtitle",
  seoTitleKey: "ceremony.wedding.seoTitle",
  seoDescKey: "ceremony.wedding.seoDesc",
  seoPath: "/mein-bereich/hochzeit",
  fields: [
    { key: "partnerName1", labelKey: "ceremony.wedding.partner1", placeholder: "z.B. Anna Müller" },
    { key: "partnerName2", labelKey: "ceremony.wedding.partner2", placeholder: "z.B. Thomas Meier" },
    { key: "weddingDate", labelKey: "ceremony.wedding.date", placeholder: "", type: "date" },
    { key: "venue", labelKey: "ceremony.wedding.venue", placeholder: "z.B. Kirche St. Peter, Zürich" },
    {
      key: "tradition", labelKey: "ceremony.wedding.tradition", placeholder: "", type: "select",
      options: [
        { value: "reformed", label: "Reformiert" },
        { value: "catholic", label: "Katholisch" },
        { value: "lutheran", label: "Lutherisch" },
        { value: "evangelical", label: "Evangelikal" },
        { value: "secular", label: "Freie Trauung" },
      ],
    },
  ],
  notesPlaceholder: "Eure Geschichte, Wünsche für die Zeremonie, besondere Momente die erwähnt werden sollen…",
  generateLabel: "Trauungstext generieren",
  pdfTitle: (fd) => fd.partnerName1 && fd.partnerName2 ? `${fd.partnerName1} & ${fd.partnerName2}` : "Trauung",
  pdfFileName: (fd) => fd.partnerName1 && fd.partnerName2 ? `Trauung_${fd.partnerName1}_${fd.partnerName2}.pdf` : "Trauung.pdf",
  suggestedTags: ["hochzeit", "wedding", "liebe", "love"],
};

export const BAPTISM_CONFIG: CeremonyConfig = {
  type: "baptism",
  edgeFnType: "baptism",
  titleKey: "ceremony.baptism.title",
  subtitleKey: "ceremony.baptism.subtitle",
  seoTitleKey: "ceremony.baptism.seoTitle",
  seoDescKey: "ceremony.baptism.seoDesc",
  seoPath: "/mein-bereich/taufe",
  fields: [
    { key: "childName", labelKey: "ceremony.baptism.childName", placeholder: "z.B. Lena Müller" },
    { key: "birthDate", labelKey: "ceremony.baptism.birthDate", placeholder: "", type: "date" },
    { key: "parents", labelKey: "ceremony.baptism.parents", placeholder: "z.B. Anna und Thomas Müller" },
    { key: "godparents", labelKey: "ceremony.baptism.godparents", placeholder: "z.B. Sara Meier, Peter Fischer" },
    {
      key: "tradition", labelKey: "ceremony.baptism.tradition", placeholder: "", type: "select",
      options: [
        { value: "reformed", label: "Reformiert" },
        { value: "catholic", label: "Katholisch" },
        { value: "lutheran", label: "Lutherisch" },
        { value: "evangelical", label: "Evangelikal" },
      ],
    },
  ],
  notesPlaceholder: "Taufwünsche, besondere Bibelverse, was euch für die Taufe wichtig ist…",
  generateLabel: "Tauftext generieren",
  pdfTitle: (fd) => fd.childName ? `Taufe von ${fd.childName}` : "Taufe",
  pdfFileName: (fd) => fd.childName ? `Taufe_${fd.childName.replace(/\s+/g, "_")}.pdf` : "Taufe.pdf",
  suggestedTags: ["taufe", "baptism", "taufgebet"],
};

export const CONFIRMATION_CONFIG: CeremonyConfig = {
  type: "confirmation",
  edgeFnType: "confirmation",
  titleKey: "ceremony.confirmation.title",
  subtitleKey: "ceremony.confirmation.subtitle",
  seoTitleKey: "ceremony.confirmation.seoTitle",
  seoDescKey: "ceremony.confirmation.seoDesc",
  seoPath: "/mein-bereich/konfirmation",
  fields: [
    { key: "confirmandName", labelKey: "ceremony.confirmation.name", placeholder: "z.B. Lukas Müller" },
    { key: "confirmationVerse", labelKey: "ceremony.confirmation.verse", placeholder: "z.B. Psalm 23,1 oder leer lassen für Vorschläge" },
    { key: "hobbies", labelKey: "ceremony.confirmation.hobbies", placeholder: "z.B. Fussball, Musik, Natur" },
    {
      key: "tradition", labelKey: "ceremony.confirmation.tradition", placeholder: "", type: "select",
      options: [
        { value: "reformed", label: "Reformiert / Konfirmation" },
        { value: "catholic_communion", label: "Katholisch / Erstkommunion" },
        { value: "catholic_firmung", label: "Katholisch / Firmung" },
        { value: "lutheran", label: "Lutherisch / Konfirmation" },
      ],
    },
  ],
  notesPlaceholder: "Persönliche Gedanken, Glaubensweg, besondere Wünsche für die Feier…",
  generateLabel: "Text generieren",
  pdfTitle: (fd) => fd.confirmandName ? `Konfirmation / Firmung — ${fd.confirmandName}` : "Konfirmation",
  pdfFileName: (fd) => fd.confirmandName ? `Konfirmation_${fd.confirmandName.replace(/\s+/g, "_")}.pdf` : "Konfirmation.pdf",
  suggestedTags: ["konfirmation", "firmung", "confirmation", "erstkommunion"],
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
interface Props {
  config: CeremonyConfig;
}

export default function CeremonyWriter({ config }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const ceremonyType = config.type as "wedding" | "baptism" | "confirmation";
  const { draftsQuery, saveDraft, toggleShare } = useCeremonyDrafts(ceremonyType);
  const { data: allResources = [] } = useResources();

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // AI generation
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load draft
  useEffect(() => {
    if (draftsQuery.data && draftsQuery.data.length > 0 && !draftId) {
      const draft = draftsQuery.data[0];
      setDraftId(draft.id);
      setShareToken(draft.share_token);
      setIsShared(draft.is_shared);
      setGeneratedText(draft.generated_text || "");
      const fd = draft.form_data as Record<string, string> | null;
      if (fd) {
        setFormData(fd);
        setNotes(fd._notes || "");
      }
    }
  }, [draftsQuery.data]);

  // Resource suggestions
  const suggestedResources = allResources.filter((r) =>
    r.is_system &&
    (r.tags ?? []).some((tag) => config.suggestedTags.includes(tag.toLowerCase()))
  ).slice(0, 8);

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Bitte melde dich an, um zu speichern.");
      return;
    }
    try {
      const result = await saveDraft.mutateAsync({
        id: draftId || undefined,
        ceremony_type: ceremonyType,
        person_name: formData[config.fields[0]?.key] || "",
        form_data: { ...formData, _notes: notes },
        generated_text: generatedText,
      });
      setDraftId(result.id);
      setShareToken(result.share_token);
      setIsShared(result.is_shared);
      toast.success("Entwurf gespeichert");
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleToggleShare = async () => {
    if (!draftId) await handleSave();
    const id = draftId || saveDraft.data?.id;
    if (!id) return;
    try {
      const result = await toggleShare.mutateAsync({ id, is_shared: !isShared });
      setIsShared(!isShared);
      if (!isShared && result.share_token) {
        setShareToken(result.share_token);
        const url = `${window.location.origin}/shared/${result.share_token}`;
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
        toast.success("Link kopiert – teile ihn mit deinem Seelsorger");
      } else {
        toast.info("Freigabe deaktiviert");
      }
    } catch {
      toast.error("Fehler beim Teilen");
    }
  };

  const copyShareLink = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/shared/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
    toast.success("Link kopiert");
  };

  const generateText = async () => {
    setIsGenerating(true);
    setGeneratedText("");

    try {
      // Map tradition to edge fn type
      let edgeFnType = config.edgeFnType;
      if (ceremonyType === "confirmation") {
        const trad = formData.tradition || "";
        if (trad === "catholic_communion") edgeFnType = "first_communion";
        else if (trad === "catholic_firmung") edgeFnType = "firmung";
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ceremony-writer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            ceremonyType: edgeFnType,
            formData,
            notes,
            language: i18n.language,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setGeneratedText(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Fehler bei der Generierung");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedText) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 25;
    const maxWidth = pageWidth - margin * 2;

    const title = config.pdfTitle(formData);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(title, maxWidth), pageWidth / 2, 35, { align: "center" });

    const lineY = 42;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, lineY, pageWidth - margin - 20, lineY);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(generatedText, maxWidth);
    const lineHeight = 6;
    let currentY = lineY + 12;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (const line of lines) {
      if (currentY + lineHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 25;
      }
      doc.text(line, margin, currentY);
      currentY += lineHeight;
    }

    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text("Erstellt mit BibleBot.Life", pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.save(config.pdfFileName(formData));
  };

  const resourceIcon = (type: string) => {
    if (type === "song") return <Music className="h-3.5 w-3.5" />;
    if (type === "prayer") return <HandHeart className="h-3.5 w-3.5" />;
    return <BookOpenText className="h-3.5 w-3.5" />;
  };

  return (
    <div className="bg-background">
      <SEOHead titleKey={config.seoTitleKey} descKey={config.seoDescKey} path={config.seoPath} />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/mein-bereich" className="hidden md:block">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{t(config.titleKey)}</h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{t(config.subtitleKey)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveDraft.isPending} className="gap-1.5 shrink-0">
            {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">Speichern</span>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Step 1: Form fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              Angaben zur Zeremonie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>{t(field.labelKey, field.labelKey)}</Label>
                  {field.type === "select" && field.options ? (
                    <Select value={formData[field.key] || ""} onValueChange={(v) => updateField(field.key, v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Bitte wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type || "text"}
                      value={formData[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Notes & wishes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              Persönliche Notizen & Wünsche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={config.notesPlaceholder}
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Resource Suggestions */}
        {suggestedResources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">💡</span>
                Vorschläge aus der Bibliothek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedResources.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5 text-primary">{resourceIcon(r.resource_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {r.hymnal_ref && (
                          <Badge variant="outline" className="text-xs font-mono">{r.hymnal_ref}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{r.resource_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Weitere Ressourcen findest du in der <Link to="/dashboard/resources" className="underline text-primary">Bibliothek</Link>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              Text generieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateText} disabled={isGenerating} className="w-full gap-2" size="lg">
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isGenerating ? "Wird generiert…" : config.generateLabel}
            </Button>

            {generatedText && (
              <div className="space-y-3">
                <Textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={16}
                  className="text-sm leading-relaxed"
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={downloadPDF} className="gap-2 flex-1">
                    <Download className="h-4 w-4" />
                    Als PDF herunterladen
                  </Button>
                  <Button onClick={generateText} variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Neu generieren
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Share */}
        {generatedText && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                Mit Seelsorger teilen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Erstelle einen Link, den du per E-Mail oder Messenger an deinen Seelsorger senden kannst.
              </p>
              {!isShared ? (
                <Button onClick={handleToggleShare} variant="outline" className="gap-2 w-full" disabled={toggleShare.isPending}>
                  {toggleShare.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  Link erstellen & kopieren
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 text-sm font-mono truncate">
                      {window.location.origin}/shared/{shareToken}
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyShareLink}>
                      {linkCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <a href={`${window.location.origin}/shared/${shareToken}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                  <Button onClick={handleToggleShare} variant="ghost" size="sm" className="text-muted-foreground" disabled={toggleShare.isPending}>
                    Freigabe deaktivieren
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
