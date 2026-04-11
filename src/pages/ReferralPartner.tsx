import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Link, MousePointerClick, TrendingUp, DollarSign, QrCode, History } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { BrandedQRCode } from "@/components/BrandedQRCode";

export default function ReferralPartner() {
  const { code } = useParams<{ code: string }>();
  const [showQR, setShowQR] = useState(false);

  const { data: partner, isLoading, error } = useQuery({
    queryKey: ["referral-partner", code],
    queryFn: async () => {
      if (!code) throw new Error("Kein Code angegeben");
      const { data, error } = await supabase.rpc("get_referral_partner_stats", {
        p_code: code,
      });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Partner nicht gefunden");
      return data[0];
    },
    enabled: !!code,
  });

  const referralLink = `https://biblebot.life/for-churches?ref=${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link kopiert!");
  };

  const conversionRate =
    partner && partner.total_clicks > 0
      ? ((partner.total_conversions / partner.total_clicks) * 100).toFixed(1)
      : "0.0";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden…</div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Partner-Code nicht gefunden oder inaktiv.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${partner.name} — BibleBot.Life Partner`}
        description="Referral-Partner-Dashboard von BibleBot.Life"
      />
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Willkommen, {partner.name}!
            </h1>
            <p className="text-muted-foreground">
              Dein persönliches Referral-Dashboard
            </p>
            <Badge variant="outline" className="text-sm">
              Code: {partner.code}
            </Badge>
          </div>

          {/* Referral Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link className="h-5 w-5 text-primary" />
                Dein persönlicher Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                  {referralLink}
                </code>
                <Button size="icon" variant="outline" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {showQR ? "QR ausblenden" : "QR-Code anzeigen"}
                </Button>
              </div>
              {showQR && (
                <div className="flex justify-center pt-4">
                  <BrandedQRCode value={referralLink} size={200} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <MousePointerClick className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  {partner.total_clicks}
                </p>
                <p className="text-sm text-muted-foreground">Klicks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  {partner.total_conversions}
                </p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">
                  CHF {Number(partner.total_commission).toLocaleString("de-CH")}
                </p>
                <p className="text-sm text-muted-foreground">Provision</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold text-foreground">
                  {conversionRate}%
                </p>
                <p className="text-sm text-muted-foreground">Conversion-Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Info */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Deine Provisionsrate:{" "}
                <span className="font-semibold text-foreground">
                  {(Number(partner.commission_rate) * 100).toFixed(0)}%
                </span>{" "}
                pro Patronats-Conversion
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Teile deinen persönlichen Link mit Kirchgemeinden, die BibleBot.Life
            nutzen möchten. Bei jeder Patronats-Anfrage über deinen Link erhältst
            du automatisch deine Provision.
          </p>
        </div>
      </div>
    </>
  );
}
