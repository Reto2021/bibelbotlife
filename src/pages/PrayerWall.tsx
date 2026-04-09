import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { Heart, Send, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function getSessionId() {
  let id = localStorage.getItem("biblebot-session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("biblebot-session", id);
  }
  return id;
}

interface PrayerRequest {
  id: string;
  content: string;
  is_anonymous: boolean;
  author_name: string | null;
  prayer_count: number;
  created_at: string;
}

export default function PrayerWall() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prayedFor, setPrayedFor] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("biblebot-prayed");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data } = await supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setRequests(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) return;
    setSubmitting(true);

    const { error } = await supabase.from("prayer_requests").insert({
      content: content.trim().slice(0, 500),
      is_anonymous: isAnonymous,
      author_name: isAnonymous ? null : (authorName.trim().slice(0, 50) || null),
      session_id: getSessionId(),
    });

    if (error) {
      toast({ title: "Fehler", description: "Bitte versuche es erneut.", variant: "destructive" });
    } else {
      toast({ title: "🙏 Gebetsanliegen geteilt", description: "Danke für dein Vertrauen." });
      setContent("");
      setAuthorName("");
      fetchRequests();
    }
    setSubmitting(false);
  }

  async function handlePray(id: string) {
    if (prayedFor.has(id)) return;
    const newSet = new Set(prayedFor).add(id);
    setPrayedFor(newSet);
    localStorage.setItem("biblebot-prayed", JSON.stringify([...newSet]));

    // Optimistic update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, prayer_count: r.prayer_count + 1 } : r));

    await supabase.rpc("increment_prayer_count", { request_id: id });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins} Min.`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tag${days > 1 ? "en" : ""}`;
  }

  return (
    <>
      <SEOHead
        title="Gebetswand – Füreinander beten | BibleBot.Life"
        description="Teile dein Gebetsanliegen und bete für andere. Eine Gemeinschaft, die füreinander einsteht."
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">🙏 Gebetswand</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Teile dein Anliegen – die Gemeinschaft betet mit dir.
              </p>
            </div>
          </div>

          {/* Submit form */}
          <Card className="p-5 mb-8 border-primary/20 bg-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Was liegt dir auf dem Herzen?"
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 500))}
                rows={3}
                className="resize-none"
                required
                minLength={5}
                maxLength={500}
              />

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Switch
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
                    Anonym posten
                  </Label>
                </div>

                {!isAnonymous && (
                  <Input
                    placeholder="Dein Name (optional)"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value.slice(0, 50))}
                    className="max-w-[180px]"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{content.length}/500</span>
                <Button type="submit" disabled={submitting || content.trim().length < 5} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Anliegen teilen
                </Button>
              </div>
            </form>
          </Card>

          {/* Prayer requests list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🕊️</p>
              <p>Noch keine Gebetsanliegen. Sei der/die Erste!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {requests.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  >
                    <Card className="p-4 hover:border-primary/20 transition-colors">
                      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {req.content}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{req.is_anonymous ? "Anonym" : (req.author_name || "Jemand")}</span>
                          <span>·</span>
                          <span>{timeAgo(req.created_at)}</span>
                        </div>
                        <Button
                          variant={prayedFor.has(req.id) ? "default" : "outline"}
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => handlePray(req.id)}
                          disabled={prayedFor.has(req.id)}
                        >
                          <Heart className={`h-3.5 w-3.5 ${prayedFor.has(req.id) ? "fill-current" : ""}`} />
                          {req.prayer_count > 0 && <span>{req.prayer_count}</span>}
                          {prayedFor.has(req.id) ? "Gebetet" : "Ich bete"}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
