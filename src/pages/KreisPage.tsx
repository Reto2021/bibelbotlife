import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Users, Plus, LogIn, Copy, BookOpen, CheckCircle2, Heart } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCircle } from "@/hooks/use-circle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function KreisOnboarding() {
  const { t } = useTranslation();
  const { createCircle, joinCircle } = useCircle();
  const [circleName, setCircleName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-12 max-w-3xl"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
          <Users className="h-4 w-4" />
          {t("circle.nav")}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("circle.noCircleTitle")}</h1>
        <p className="text-muted-foreground">{t("circle.noCircleDesc")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>{t("circle.createTitle")}</CardTitle>
            <CardDescription>{t("circle.createDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t("circle.namePlaceholder")}
              value={circleName}
              onChange={e => setCircleName(e.target.value)}
              maxLength={50}
            />
            <Input
              placeholder={t("circle.displayNamePlaceholder")}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={30}
            />
            <Button
              className="w-full"
              disabled={!circleName.trim() || !displayName.trim() || createCircle.isPending}
              onClick={() => createCircle.mutate({ name: circleName.trim(), displayName: displayName.trim() })}
            >
              {t("circle.createTitle")}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-2">
              <LogIn className="h-5 w-5 text-secondary" />
            </div>
            <CardTitle>{t("circle.joinTitle")}</CardTitle>
            <CardDescription>{t("circle.joinDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t("circle.inviteCodePlaceholder")}
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              maxLength={8}
            />
            <Input
              placeholder={t("circle.displayNamePlaceholder")}
              value={joinDisplayName}
              onChange={e => setJoinDisplayName(e.target.value)}
              maxLength={30}
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={!inviteCode.trim() || !joinDisplayName.trim() || joinCircle.isPending}
              onClick={() => joinCircle.mutate({ inviteCode: inviteCode.trim(), displayName: joinDisplayName.trim() })}
            >
              {t("circle.joinTitle")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function OverviewTab() {
  const { t } = useTranslation();
  const { circle, members, journeyProgress, isCreator } = useCircle();
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  const copyInviteLink = () => {
    if (!circle) return;
    const url = `${window.location.origin}/mein-kreis?code=${circle.invite_code}`;
    navigator.clipboard.writeText(url);
    toast.success(t("circle.inviteCopied"));
  };

  const generateQuestions = async () => {
    if (!circle?.weekly_bible_book) return;
    setGenerating(true);
    try {
      const ref = `${circle.weekly_bible_book} ${circle.weekly_bible_chapter || ""}`.trim();
      const { data, error } = await supabase.functions.invoke("circle-questions", {
        body: { bible_reference: ref, circle_id: circle.id },
      });
      if (error) throw error;
      setQuestions(data.questions || []);
    } catch (e) {
      toast.error("Fehler beim Generieren");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{circle?.name}</h2>
          <p className="text-sm text-muted-foreground">{members.length} Mitglieder</p>
        </div>
        <Button variant="outline" size="sm" onClick={copyInviteLink}>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          {t("circle.inviteLink")}
        </Button>
      </div>

      {/* Weekly verse */}
      {circle?.weekly_bible_book && (
        <Card className="bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {t("circle.weeklyVerse")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground font-medium">
              {circle.weekly_bible_book} {circle.weekly_bible_chapter}
            </p>
            <Button size="sm" variant="outline" onClick={generateQuestions} disabled={generating}>
              {t("circle.generateQuestions")}
            </Button>
            {questions.length > 0 && (
              <ul className="space-y-2 mt-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card className="bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mitglieder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map(m => {
              const progress = journeyProgress.find(p => p.user_id === m.user_id);
              const isActive = progress?.last_active_date === today;
              return (
                <div key={m.id} className="flex items-center gap-3 py-1.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {m.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground">{m.display_name}</span>
                  {isActive && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1" />
                      {t("circle.membersOnline")}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PrayersTab() {
  const { t } = useTranslation();
  const { prayers, addPrayer, prayFor, markAnswered } = useCircle();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [showAnswered, setShowAnswered] = useState(false);

  const filteredPrayers = showAnswered ? prayers : prayers.filter(p => !p.is_answered);

  const handleSubmit = () => {
    if (!content.trim()) return;
    addPrayer.mutate(content.trim());
    setContent("");
  };

  return (
    <div className="space-y-4">
      {/* New prayer form */}
      <Card className="bg-card/80">
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder={t("circle.prayerPlaceholder")}
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{content.length}/500</span>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || addPrayer.isPending}>
              Senden
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toggle answered */}
      <button
        onClick={() => setShowAnswered(!showAnswered)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAnswered ? "Erhörte ausblenden" : `Erhörte anzeigen (${prayers.filter(p => p.is_answered).length})`}
      </button>

      {/* Prayer list */}
      {filteredPrayers.map(prayer => (
        <motion.div
          key={prayer.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`bg-card/80 ${prayer.is_answered ? "opacity-60" : ""}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-medium text-foreground">{prayer.display_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(prayer.created_at).toLocaleDateString("de-CH")}
                  </span>
                </div>
                {prayer.is_answered && (
                  <Badge variant="secondary" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Erhört
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground/80 mb-3">{prayer.content}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => prayFor.mutate(prayer.id)}
                >
                  {t("circle.prayButton")} ({prayer.prayer_count})
                </Button>
                {prayer.user_id === user?.id && !prayer.is_answered && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => markAnswered.mutate(prayer.id)}
                  >
                    {t("circle.answeredButton")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {filteredPrayers.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Noch keine Gebetsanliegen. Teile dein erstes Anliegen! 🙏
        </p>
      )}
    </div>
  );
}

function JourneyTab() {
  const { t } = useTranslation();
  const { journeyProgress, members, updateJourneyProgress } = useCircle();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const myProgress = journeyProgress.find(p => p.user_id === user?.id);
  const alreadyUpdatedToday = myProgress?.last_active_date === today;

  // Motivation text
  const maxDays = Math.max(0, ...journeyProgress.map(p => p.days_completed));
  const leader = journeyProgress.find(p => p.days_completed === maxDays && maxDays > 0);
  let motivation = "";
  if (maxDays === 0) {
    motivation = "Startet gemeinsam — heute ist der beste Tag ✨";
  } else if (leader && leader.user_id !== user?.id) {
    motivation = `${leader.display_name} ist schon auf Tag ${leader.days_completed} — ihr könnt aufholen! 💪`;
  }

  return (
    <div className="space-y-4">
      {motivation && (
        <div className="bg-primary/10 rounded-xl p-4 text-sm text-foreground/80 text-center">
          {motivation}
        </div>
      )}

      <Button
        className="w-full"
        disabled={alreadyUpdatedToday || updateJourneyProgress.isPending}
        onClick={() => updateJourneyProgress.mutate()}
      >
        {alreadyUpdatedToday ? "Heute bereits abgeschlossen ✓" : t("circle.journeyUpdateButton")}
      </Button>

      <div className="space-y-3">
        {members.map(m => {
          const progress = journeyProgress.find(p => p.user_id === m.user_id);
          const days = progress?.days_completed ?? 0;
          const isActive = progress?.last_active_date === today;
          const isMe = m.user_id === user?.id;

          return (
            <Card key={m.id} className={`bg-card/80 ${isMe ? "ring-1 ring-primary/30" : ""}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {m.display_name} {isMe && "(du)"}
                    </span>
                    {isActive && (
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Tag {days}/21</span>
                </div>
                <Progress value={(days / 21) * 100} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function KreisDashboard() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Tabs defaultValue="overview">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="overview" className="flex-1">{t("circle.tabOverview")}</TabsTrigger>
          <TabsTrigger value="prayers" className="flex-1">{t("circle.tabPrayers")}</TabsTrigger>
          <TabsTrigger value="journey" className="flex-1">{t("circle.tabJourney")}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="prayers"><PrayersTab /></TabsContent>
        <TabsContent value="journey"><JourneyTab /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function KreisPage() {
  const { t } = useTranslation();
  const { isLoading, hasCircle } = useCircle();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead titleKey="circle.nav" descKey="circle.noCircleDesc" path="/mein-kreis" />
      <SiteHeader />
      {isLoading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Wird geladen…</div>
        </div>
      ) : hasCircle ? (
        <KreisDashboard />
      ) : (
        <KreisOnboarding />
      )}
    </div>
  );
}
