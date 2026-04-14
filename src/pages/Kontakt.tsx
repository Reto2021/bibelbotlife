import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["feedback", "question", "partnership", "other"] as const;

export default function Kontakt() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "" as string,
    message: "",
  });

  const categoryLabels: Record<string, string> = {
    feedback: t("contact.categoryFeedback", "Feedback"),
    question: t("contact.categoryQuestion", "Frage"),
    partnership: t("contact.categoryPartnership", "Partnerschaft"),
    other: t("contact.categoryOther", "Sonstiges"),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.category || !form.message.trim()) {
      toast.error(t("contact.fillAll", "Bitte fülle alle Felder aus."));
      return;
    }

    setLoading(true);
    try {
      const id = crypto.randomUUID();

      // Save to database
      const { error } = await supabase.from("contact_submissions").insert({
        id,
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        message: form.message.trim(),
      });

      if (error) throw error;

      // Send notification email to admin
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-notification",
          recipientEmail: "info@biblebot.life",
          idempotencyKey: `contact-notify-${id}`,
          templateData: {
            senderName: form.name.trim(),
            senderEmail: form.email.trim(),
            organizationType: categoryLabels[form.category],
            message: form.message.trim(),
            source: "Kontaktformular",
          },
        },
      });

      // Send confirmation email to sender
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: form.email.trim(),
          idempotencyKey: `contact-confirm-${id}`,
          templateData: {
            name: form.name.trim(),
          },
        },
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error(t("contact.errorGeneric", "Es ist ein Fehler aufgetreten. Bitte versuche es erneut."));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <SEOHead
          title={t("contact.pageTitle", "Kontakt – BibleBot.Life")}
          description={t("contact.pageDesc", "Schreibe uns eine Nachricht – wir freuen uns auf deine Anfrage.")}
        />
        <SiteHeader />
        <main className="min-h-screen bg-background pt-20 px-4 pb-16">
          <div className="max-w-lg mx-auto text-center space-y-6 py-16">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">
              {t("contact.thankYouTitle", "Vielen Dank!")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("contact.thankYouMessage", "Deine Nachricht ist bei uns eingegangen. Wir melden uns so schnell wie möglich bei dir.")}
            </p>
            <Button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", category: "", message: "" }); }} variant="outline">
              {t("contact.sendAnother", "Weitere Nachricht senden")}
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={t("contact.pageTitle", "Kontakt – BibleBot.Life")}
        description={t("contact.pageDesc", "Schreibe uns eine Nachricht – wir freuen uns auf deine Anfrage.")}
      />
      <SiteHeader />
      <main className="min-h-screen bg-background pt-20 px-4 pb-16">
        <div className="max-w-lg mx-auto space-y-8 py-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <Mail className="w-4 h-4" />
              {t("contact.badge", "Kontakt")}
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("contact.heading", "Schreibe uns")}
            </h1>
            <p className="text-muted-foreground">
              {t("contact.subheading", "Hast du eine Frage, Feedback oder möchtest du eine Partnerschaft besprechen? Wir freuen uns auf deine Nachricht.")}
            </p>
          </div>

          {/* Form */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("contact.name", "Name")} *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t("contact.namePlaceholder", "Dein Name")}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact.email", "E-Mail")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t("contact.emailPlaceholder", "deine@email.ch")}
                    maxLength={320}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("contact.category", "Anliegen")} *</Label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("contact.categoryPlaceholder", "Wähle ein Anliegen")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t("contact.message", "Nachricht")} *</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t("contact.messagePlaceholder", "Schreibe uns deine Nachricht…")}
                    maxLength={5000}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <MessageSquare className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {loading
                    ? t("contact.sending", "Wird gesendet…")
                    : t("contact.send", "Nachricht senden")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
