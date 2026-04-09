import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ChurchContactProps {
  churchId: string;
  churchName: string;
}

export const ChurchContact = ({ churchId, churchName }: ChurchContactProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("church-contact", {
        body: {
          church_id: churchId,
          sender_name: name.trim().slice(0, 100) || null,
          sender_email: email.trim(),
          message: message.trim().slice(0, 5000),
        },
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: t("church.contactSuccess"),
        description: t("church.contactSuccessDesc"),
      });
    } catch {
      toast({
        title: t("subscribe.toastError"),
        description: t("subscribe.toastErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card className="bg-card/80 border-border">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="font-semibold text-foreground">{t("church.contactSuccess")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("church.contactSuccessDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 border-border">
      <CardHeader>
        <CardTitle className="text-lg">{t("church.contactTitle", { name: churchName })}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("church.contactName")}
            />
          </div>
          <div>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("church.contactEmail")}
            />
          </div>
          <div>
            <Textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("church.contactMessage")}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {sending ? t("subscribe.submitting") : t("church.contactSend")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
