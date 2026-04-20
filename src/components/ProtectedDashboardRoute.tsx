import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useCanAccessDashboard } from "@/hooks/use-team-membership";

/**
 * Gates the /dashboard (Messeplaner) routes.
 * - Not logged in → /login
 * - Logged in but not part of any church team → /mein-bereich
 * - Logged in & owner OR active team member → render
 */
export function ProtectedDashboardRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { canAccess, isLoading } = useCanAccessDashboard();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess) return <Navigate to="/mein-bereich" replace />;

  return <>{children}</>;
}
