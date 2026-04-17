import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Mode = "login" | "signup" | "forgot";

/** After signup, create church_members entry if a church slug is stored. */
async function linkChurchMembership(userId: string, consentContact: boolean) {
  const slug = localStorage.getItem("biblebot-church");
  if (!slug) return;

  // look up church id from slug
  const { data: church } = await (supabase
    .from("church_partners_public" as any)
    .select("id")
    .eq("slug", slug)
    .maybeSingle() as any);
  if (!church?.id) return;

  await supabase.from("church_members").insert({
    user_id: userId,
    church_id: church.id,
    consent_contact: consentContact,
    source_slug: slug,
  } as any);
}

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [churchName, setChurchName] = useState<string | null>(null);

  // Check if user arrived via a church link
  useEffect(() => {
    const slug = localStorage.getItem("biblebot-church");
    if (!slug) return;
    (supabase
      .from("church_partners_public" as any)
      .select("name")
      .eq("slug", slug)
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (data?.name) setChurchName(data.name);
      });
  }, []);

  // Redirect if already logged in
  if (user) {
    navigate("/mein-bereich", { replace: true });
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: t("auth.resetSent", "Link gesendet"), description: t("auth.resetSentDesc", "Prüfe dein E-Mail-Postfach.") });
        setMode("login");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Link church membership right after signup
        if (data.user) {
          await linkChurchMembership(data.user.id, consentContact);
        }
        toast({ title: t("auth.signupSuccess", "Konto erstellt"), description: t("auth.confirmEmail", "Bitte bestätige deine E-Mail-Adresse.") });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/mein-bereich", { replace: true });
      }
    } catch (err: any) {
      toast({ title: t("auth.error", "Fehler"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      // Store consent in sessionStorage so we can use it after OAuth redirect
      if (mode === "signup" && churchName) {
        sessionStorage.setItem("biblebot-church-consent", consentContact ? "1" : "0");
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: t("auth.error", "Fehler"), description: String(result.error), variant: "destructive" });
      }
      if (result.redirected) return;
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: t("auth.error", "Fehler"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      if (mode === "signup" && churchName) {
        sessionStorage.setItem("biblebot-church-consent", consentContact ? "1" : "0");
      }
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: t("auth.error", "Fehler"), description: String(result.error), variant: "destructive" });
      }
      if (result.redirected) return;
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: t("auth.error", "Fehler"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: t("auth.loginTitle", "Anmelden"),
    signup: t("auth.signupTitle", "Konto erstellen"),
    forgot: t("auth.forgotTitle", "Passwort zurücksetzen"),
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <AppLogo className="h-10 w-10" />
            <span className="text-2xl font-bold">BibleBot<span className="text-base font-normal text-muted-foreground">.Life</span></span>
          </Link>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{titles[mode]}</CardTitle>
            <CardDescription>
              {mode === "forgot"
                ? t("auth.forgotDesc", "Gib deine E-Mail-Adresse ein.")
                : mode === "signup"
                  ? t("auth.signupDesc", "Speichere deinen Verlauf, starte deine 21-Tage-Begleitung und erhalte persönliche Impulse.")
                  : t("auth.syncDesc", "Dein Verlauf und deine Begleitung — auf allen Geräten.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode !== "forgot" && (
              <Button
                onClick={handleGoogle}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("auth.google", "Mit Google anmelden")}
              </Button>
            )}
            {mode !== "forgot" && (
              <Button
                onClick={handleApple}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {t("auth.apple", "Mit Apple anmelden")}
              </Button>
            )}

            {mode !== "forgot" && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t("auth.or", "oder")}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <Label htmlFor="email">{t("auth.email", "E-Mail")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {mode !== "forgot" && (
                <div>
                  <Label htmlFor="password">{t("auth.password", "Passwort")}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1} aria-label={showPassword ? t("auth.hidePassword", "Passwort verbergen") : t("auth.showPassword", "Passwort anzeigen")}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Church opt-in checkbox */}
              {mode === "signup" && churchName && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border">
                  <Checkbox
                    id="consent-contact"
                    checked={consentContact}
                    onCheckedChange={(v) => setConsentContact(!!v)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent-contact" className="text-xs leading-relaxed cursor-pointer font-normal">
                    {t("auth.churchConsent", "Ich erlaube {{churchName}}, mir Infos und Einladungen mitzuteilen.", { churchName })}
                  </Label>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Mail className="h-4 w-4 mr-2" />
                {mode === "forgot"
                  ? t("auth.sendReset", "Link senden")
                  : mode === "signup"
                    ? t("auth.signup", "Registrieren")
                    : t("auth.login", "Anmelden")}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("forgot")} className="underline hover:text-foreground">
                    {t("auth.forgotLink", "Passwort vergessen?")}
                  </button>
                  <p>
                    {t("auth.noAccount", "Noch kein Konto?")}{" "}
                    <button onClick={() => setMode("signup")} className="underline hover:text-foreground font-medium">
                      {t("auth.signupLink", "Jetzt registrieren")}
                    </button>
                  </p>
                </>
              )}
              {mode === "signup" && (
                <p>
                  {t("auth.hasAccount", "Bereits ein Konto?")}{" "}
                  <button onClick={() => setMode("login")} className="underline hover:text-foreground font-medium">
                    {t("auth.loginLink", "Anmelden")}
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="underline hover:text-foreground inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  {t("auth.backToLogin", "Zurück zur Anmeldung")}
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                {t("auth.continueWithout", "Ohne Login weiter chatten")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
