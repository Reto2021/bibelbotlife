import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Church, MapPin, BookOpen, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const TRADITIONS = [
  { value: "Reformiert", label: "Reformiert", desc: "Evangelisch-reformierte Tradition" },
  { value: "Katholisch", label: "Katholisch", desc: "Römisch-katholische Kirche" },
  { value: "Lutherisch", label: "Lutherisch", desc: "Evangelisch-lutherische Tradition" },
  { value: "Freikirchlich", label: "Evangelikal / Freikirchlich", desc: "Freikirchen, Vineyard, ICF etc." },
  { value: "Säkular", label: "Säkular / Frei", desc: "Freie Zeremonien ohne konfessionelle Bindung" },
];

export default function ChurchWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CH");

  const steps = [
    { icon: Church, title: "Gemeindename", desc: "Wie heisst deine Gemeinde?" },
    { icon: BookOpen, title: "Konfession", desc: "Welche Tradition?" },
    { icon: MapPin, title: "Standort", desc: "Wo befindet sich die Gemeinde?" },
  ];

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return !!denomination;
    if (step === 2) return city.trim().length >= 2;
    return false;
  };

  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9äöüàéè]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase.from("church_partners").insert({
        name: name.trim(),
        slug: slug || `church-${Date.now()}`,
        denomination,
        city: city.trim(),
        country,
        owner_id: user.id,
        is_active: false,
      } as any);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["user-church"] });
      toast.success("Gemeinde erstellt!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Erstellen");
    } finally {
      setSaving(false);
    }
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="text-center">
          <StepIcon className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle className="text-xl">{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Reformierte Kirche Zürich"
              className="text-center"
              maxLength={100}
              autoFocus
            />
          )}

          {step === 1 && (
            <div className="space-y-2">
              {TRADITIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDenomination(t.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    denomination === t.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium text-sm text-foreground">{t.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="z.B. Zürich"
                maxLength={100}
                autoFocus
              />
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="LI">🇱🇮 Liechtenstein</SelectItem>
                  <SelectItem value="OTHER">🌍 Anderes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={!canNext() || saving}>
                {saving ? "Erstelle..." : "Gemeinde erstellen"}
                <Check className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
