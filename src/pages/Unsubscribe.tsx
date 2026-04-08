import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import bibelbotLogo from "@/assets/bibelbot-logo.png";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        setStatus(data.valid ? "valid" : data.reason === "already_unsubscribed" ? "already" : "invalid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) { setStatus("error"); return; }
      setStatus(data?.success ? "success" : data?.reason === "already_unsubscribed" ? "already" : "error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <img src={bibelbotLogo} alt="BibelBot" className="h-12 w-12 mx-auto mb-4" />
        {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />}
        {status === "valid" && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-4">E-Mail-Benachrichtigungen abbestellen</h1>
            <p className="text-muted-foreground mb-6">Möchten Sie keine E-Mails mehr von BibelBot.Life erhalten?</p>
            <Button onClick={handleUnsubscribe} className="w-full">Abbestellen bestätigen</Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Erfolgreich abbestellt</h1>
            <p className="text-muted-foreground">Sie erhalten keine weiteren E-Mails mehr.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Bereits abbestellt</h1>
            <p className="text-muted-foreground">Sie haben sich bereits abgemeldet.</p>
          </>
        )}
        {status === "invalid" && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Ungültiger Link</h1>
            <p className="text-muted-foreground">Dieser Abmeldelink ist ungültig oder abgelaufen.</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Fehler</h1>
            <p className="text-muted-foreground">Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.</p>
          </>
        )}
        <Link to="/" className="inline-flex items-center gap-2 text-primary mt-6 hover:underline text-sm">
          <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
};

export default Unsubscribe;
