import { Calendar, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Willkommen zurück</h1>
        <p className="text-muted-foreground mt-1">
          {user?.email}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <Plus className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Neuer Gottesdienst</CardTitle>
            <CardDescription>Gottesdienst erstellen und planen</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Kalender</CardTitle>
            <CardDescription>Alle geplanten Gottesdienste</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Bibliothek</CardTitle>
            <CardDescription>Lieder, Gebete, Lesungen</CardDescription>
          </CardHeader>
        </Card>
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
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Ersten Gottesdienst erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
