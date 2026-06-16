import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";

/**
 * Lets a logged-in user opt in / out of BibelBot news emails.
 * Writes to public.user_marketing_preferences.
 */
export function MarketingConsentToggle() {
  const [userId, setUserId] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("user_marketing_preferences")
        .select("bibelbot_news")
        .eq("user_id", user.id)
        .maybeSingle();
      setOptIn(!!data?.bibelbot_news);
      setLoading(false);
    })();
  }, []);

  async function handleChange(next: boolean) {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_marketing_preferences")
      .upsert({
        user_id: userId,
        bibelbot_news: next,
        bibelbot_news_at: next ? new Date().toISOString() : null,
      });
    setSaving(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen: " + error.message);
      return;
    }
    setOptIn(next);
    toast.success(next ? "Du erhältst nun BibelBot-News." : "BibelBot-News abbestellt.");
  }

  if (loading || !userId) return null;

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <Label htmlFor="bibelbot-news" className="font-medium">BibelBot-News per E-Mail</Label>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Gelegentliche Hinweise zu neuen Funktionen, saisonalen Impulsen und wichtigen Updates.
              Kein Spam, jederzeit abbestellbar.
            </p>
          </div>
        </div>
        <Switch
          id="bibelbot-news"
          checked={optIn}
          disabled={saving}
          onCheckedChange={handleChange}
        />
      </CardContent>
    </Card>
  );
}
