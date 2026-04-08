import { Calendar, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { useUserChurch } from "@/hooks/use-user-church";
import ChurchWizard from "./ChurchWizard";

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: church, isLoading } = useUserChurch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Lade...</div>
      </div>
    );
  }

  // No church yet → show wizard
  if (!church) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Willkommen bei BibleBot.Life</h1>
          <p className="text-muted-foreground mt-2">
            Richte zuerst deine Gemeinde ein, um den Messeplaner zu nutzen.
          </p>
        </div>
        <ChurchWizard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{church.name}</h1>
        <p className="text-muted-foreground mt-1">
          {church.denomination} · {church.city}, {church.country}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dashboard/editor/new">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardHeader className="pb-3">
              <Plus className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Neuer Gottesdienst</CardTitle>
              <CardDescription>Gottesdienst erstellen und planen</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/dashboard/services">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardHeader className="pb-3">
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Kalender</CardTitle>
              <CardDescription>Alle geplanten Gottesdienste</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/dashboard/resources">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardHeader className="pb-3">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Bibliothek</CardTitle>
              <CardDescription>Lieder, Gebete, Lesungen</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Placeholder for upcoming services */}
      <Card>
        <CardHeader>
          <CardTitle>Nächste Gottesdienste</CardTitle>
          <CardDescription>Noch keine Gottesdienste geplant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Erstelle deinen ersten Gottesdienst, um loszulegen.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/dashboard/editor/new">
              <Plus className="h-4 w-4 mr-2" />
              Ersten Gottesdienst erstellen
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
