import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Mic, Square, Play, Pause, Trash2, Sparkles, Download, Loader2, Save, Share2, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCeremonyDrafts } from "@/hooks/use-ceremony-drafts";
import jsPDF from "jspdf";

interface Recording {
  id: string;
  blob: Blob | null;
  url: string;
  transcript: string;
  duration: number;
}

const EulogyWriter = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { draftsQuery, saveDraft, toggleShare } = useCeremonyDrafts("funeral");

  // Form state
  const [personName, setPersonName] = useState("");
  const [personAge, setPersonAge] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI generation state
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Speech recognition
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef("");

  // Load most recent draft
  useEffect(() => {
    if (draftsQuery.data && draftsQuery.data.length > 0 && !draftId) {
      const draft = draftsQuery.data[0];
      setDraftId(draft.id);
      setPersonName(draft.person_name || "");
      setShareToken(draft.share_token);
      setIsShared(draft.is_shared);
      setGeneratedText(draft.generated_text || "");
      const fd = draft.form_data as Record<string, string> | null;
      if (fd) {
        setPersonAge(fd.personAge || "");
        setAdditionalNotes(fd.additionalNotes || "");
      }
      const tr = draft.transcripts as Array<{ text: string; duration: number }> | null;
      if (tr && tr.length > 0) {
        setRecordings(tr.map((t, i) => ({
          id: `loaded-${i}`,
          blob: null,
          url: "",
          transcript: t.text,
          duration: t.duration,
        })));
      }
    }
  }, [draftsQuery.data]);

  useEffect(() => {
    return () => {
      recordings.forEach((r) => { if (r.url) URL.revokeObjectURL(r.url); });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!user) {
      toast.error("Bitte melde dich an, um zu speichern.");
      return;
    }
    try {
      const result = await saveDraft.mutateAsync({
        id: draftId || undefined,
        ceremony_type: "funeral",
        person_name: personName,
        form_data: { personAge, additionalNotes },
        transcripts: recordings.map((r) => ({ text: r.transcript, duration: r.duration })),
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
    if (!draftId) {
      await handleSave();
    }
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const id = crypto.randomUUID();
        const duration = recordingTime;

        setRecordings((prev) => [
          ...prev,
          { id, blob, url, transcript: interimTranscriptRef.current, duration },
        ]);
        interimTranscriptRef.current = "";
        stream.getTracks().forEach((track) => track.stop());
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = i18n.language === "en" ? "en-US" : "de-CH";

        let finalTranscript = "";
        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          interimTranscriptRef.current = finalTranscript + interim;
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error(t("eulogy.micError"));
    }
  }, [recordingTime, i18n.language, t]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const deleteRecording = (id: string) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec?.url) URL.revokeObjectURL(rec.url);
      return prev.filter((r) => r.id !== id);
    });
  };

  const togglePlayback = (rec: Recording) => {
    if (!rec.url) return;
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(rec.url);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(rec.id);
    }
  };

  const updateTranscript = (id: string, transcript: string) => {
    setRecordings((prev) => prev.map((r) => (r.id === id ? { ...r, transcript } : r)));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const generateEulogy = async () => {
    const allTranscripts = recordings.map((r) => r.transcript).filter(Boolean).join("\n\n");
    const fullTranscript = [allTranscripts, additionalNotes].filter(Boolean).join("\n\n---\nZusätzliche Notizen:\n");

    if (fullTranscript.trim().length < 10) {
      toast.error(t("eulogy.needMore"));
      return;
    }

    setIsGenerating(true);
    setGeneratedText("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eulogy-writer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            transcript: fullTranscript,
            personName,
            personAge,
            additionalInfo: additionalNotes,
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
      toast.error(e.message || t("eulogy.genError"));
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

    if (personName) {
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(doc.splitTextToSize(personName, maxWidth), pageWidth / 2, 35, { align: "center" });
    }

    if (personAge) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(personAge, pageWidth / 2, personName ? 45 : 35, { align: "center" });
      doc.setTextColor(0);
    }

    const lineY = (personName ? 50 : 40) + (personAge ? 5 : 0);
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, lineY, pageWidth - margin - 20, lineY);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const textY = lineY + 12;
    const lines = doc.splitTextToSize(generatedText, maxWidth);
    const lineHeight = 6;
    let currentY = textY;
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

    const fileName = personName ? `Lebenslauf_${personName.replace(/\s+/g, "_")}.pdf` : "Lebenslauf.pdf";
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead titleKey="eulogy.pageTitle" descKey="eulogy.pageDesc" path="/mein-bereich/abdankung" />

      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/mein-bereich">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{t("eulogy.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("eulogy.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveDraft.isPending}
              className="gap-1.5"
            >
              {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{t("eulogy.save", "Speichern")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Person info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              {t("eulogy.step1")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="personName">{t("eulogy.name")}</Label>
                <Input
                  id="personName"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder={t("eulogy.namePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="personAge">{t("eulogy.age")}</Label>
                <Input
                  id="personAge"
                  value={personAge}
                  onChange={(e) => setPersonAge(e.target.value)}
                  placeholder={t("eulogy.agePlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Audio recordings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              {t("eulogy.step2")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("eulogy.step2Desc")}</p>

            <div className="flex items-center justify-center gap-4">
              {isRecording ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                    </span>
                    <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                  </div>
                  <Button onClick={stopRecording} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    {t("eulogy.stop")}
                  </Button>
                </div>
              ) : (
                <Button onClick={startRecording} size="lg" className="gap-2">
                  <Mic className="h-5 w-5" />
                  {recordings.length > 0 ? t("eulogy.addRecording") : t("eulogy.startRecording")}
                </Button>
              )}
            </div>

            {recordings.length > 0 && (
              <div className="space-y-3">
                {recordings.map((rec, i) => (
                  <div key={rec.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t("eulogy.recording")} {i + 1} ({formatTime(rec.duration)})
                      </span>
                      <div className="flex gap-1">
                        {rec.url && (
                          <Button variant="ghost" size="icon" onClick={() => togglePlayback(rec)}>
                            {playingId === rec.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteRecording(rec.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("eulogy.transcript")}</Label>
                      <Textarea
                        value={rec.transcript}
                        onChange={(e) => updateTranscript(rec.id, e.target.value)}
                        placeholder={t("eulogy.transcriptPlaceholder")}
                        rows={3}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>{t("eulogy.additionalNotes")}</Label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder={t("eulogy.notesPlaceholder")}
                rows={4}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Generate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              {t("eulogy.step3")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateEulogy}
              disabled={isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {isGenerating ? t("eulogy.generating") : t("eulogy.generate")}
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
                    {t("eulogy.downloadPDF")}
                  </Button>
                  <Button onClick={generateEulogy} variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t("eulogy.regenerate")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Share with pastor */}
        {generatedText && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                {t("eulogy.shareStep", "Mit Seelsorger teilen")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("eulogy.shareDesc", "Erstelle einen Link, den du per E-Mail oder Messenger an deinen Seelsorger senden kannst. Er kann den Text lesen und als PDF herunterladen.")}
              </p>

              {!isShared ? (
                <Button
                  onClick={handleToggleShare}
                  variant="outline"
                  className="gap-2 w-full"
                  disabled={toggleShare.isPending}
                >
                  {toggleShare.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {t("eulogy.enableShare", "Link erstellen & kopieren")}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 text-sm font-mono truncate">
                      {window.location.origin}/shared/{shareToken}
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyShareLink}>
                      {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <a
                      href={`${window.location.origin}/shared/${shareToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                  <Button
                    onClick={handleToggleShare}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled={toggleShare.isPending}
                  >
                    {t("eulogy.disableShare", "Freigabe deaktivieren")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default EulogyWriter;
