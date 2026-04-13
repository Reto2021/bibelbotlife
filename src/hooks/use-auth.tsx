import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // After OAuth signup, link church membership if consent was stored
        if (event === "SIGNED_IN" && session?.user) {
          const consent = sessionStorage.getItem("biblebot-church-consent");
          const slug = localStorage.getItem("biblebot-church");
          if (consent !== null && slug) {
            sessionStorage.removeItem("biblebot-church-consent");
            try {
              const { data: church } = await (supabase
                .from("church_partners_public" as any)
                .select("id")
                .eq("slug", slug)
                .maybeSingle() as any);
              if (church?.id) {
                await supabase.from("church_members").upsert({
                  user_id: session.user.id,
                  church_id: church.id,
                  consent_contact: consent === "1",
                  source_slug: slug,
                } as any, { onConflict: "user_id,church_id" });
              }
            } catch {
              // silent — non-critical
            }
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
