import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Team</h1>
      <Card>
        <CardHeader>
          <Users className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Team-Verwaltung</CardTitle>
          <CardDescription>Mitarbeitende, Rollen und Rotation verwalten</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kommt in Phase 6.</p>
        </CardContent>
      </Card>
    </div>
  );
}
