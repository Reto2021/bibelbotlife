import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Coffee, BookOpen, Check } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Link, useSearchParams } from "react-router-dom";

const PRESET_AMOUNTS = [
  { label: "CHF 5", cents: 500, icon: Coffee },
  { label: "CHF 10", cents: 1000, icon: BookOpen },
  { label: "CHF 25", cents: 2500, icon: Heart },
];

function DonationThankYou() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-lg py-20 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Herzlichen Dank!</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Deine Spende hilft uns, BibleBot.Life weiterzuentwickeln und kostenlos zugänglich zu halten. Gott segne dich!
        </p>
        <Link to="/">
          <Button>Zurück zur Startseite</Button>
        </Link>
      </div>
    </div>
  );
}

function DonationForm() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const getAmountCents = (): number => {
    if (selectedPreset !== null) return PRESET_AMOUNTS[selectedPreset].cents;
    const parsed = parseFloat(customAmount);
    if (!isNaN(parsed) && parsed >= 1) return Math.round(parsed * 100);
    return 0;
  };

  const amountCents = getAmountCents();
  const canProceed = amountCents >= 100; // min CHF 1

  const fetchClientSecret = async (): Promise<string> => {
    const body: Record<string, unknown> = {
      environment: getStripeEnvironment(),
      returnUrl: `${window.location.origin}/spenden/danke?session_id={CHECKOUT_SESSION_ID}`,
    };

    if (isMonthly) {
      body.priceId = "support_monthly_5";
    } else if (selectedPreset !== null) {
      const presetMap = ["donation_5", "donation_10", "donation_25"];
      body.priceId = presetMap[selectedPreset];
    } else {
      body.customAmountCents = amountCents;
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", { body });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Checkout-Fehler");
    }
    return data.clientSecret;
  };

  if (showCheckout) {
    return (
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => setShowCheckout(false)}>
          ← Zurück
        </Button>
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Preset amounts */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Einmalige Spende</h3>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_AMOUNTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => { setSelectedPreset(i); setCustomAmount(""); setIsMonthly(false); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedPreset === i && !isMonthly
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Eigener Betrag (CHF)</h3>
        <Input
          type="number"
          min="1"
          step="1"
          placeholder="z.B. 50"
          value={customAmount}
          onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); setIsMonthly(false); }}
        />
      </div>

      {/* Monthly option */}
      <div>
        <button
          onClick={() => { setIsMonthly(!isMonthly); setSelectedPreset(null); setCustomAmount(""); }}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
            isMonthly ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          }`}
        >
          <Heart className="h-5 w-5 text-primary" />
          <div className="text-left">
            <span className="font-semibold text-foreground">CHF 5 / Monat</span>
            <p className="text-sm text-muted-foreground">Regelmässige Unterstützung</p>
          </div>
        </button>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!isMonthly && !canProceed}
        onClick={() => setShowCheckout(true)}
      >
        {isMonthly ? "Monatlich CHF 5 spenden" : `CHF ${(amountCents / 100).toFixed(0)} spenden`}
      </Button>
    </div>
  );
}

export default function Spenden() {
  const [searchParams] = useSearchParams();
  const isThankYou = window.location.pathname.includes("/danke");

  if (isThankYou) return <DonationThankYou />;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Spenden – BibleBot.Life"
        description="Unterstütze BibleBot.Life mit einer Spende und hilf, den kostenlosen Bibel-Begleiter weiterzuentwickeln."
      />
      <PaymentTestModeBanner />
      <SiteHeader />
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            <Heart className="h-4 w-4" />
            Unterstützung
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            BibleBot.Life unterstützen
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            BibleBot.Life ist und bleibt kostenlos. Mit deiner Spende hilfst du uns, die App weiterzuentwickeln und für alle zugänglich zu halten.
          </p>
        </div>

        <DonationForm />
      </div>
    </div>
  );
}
