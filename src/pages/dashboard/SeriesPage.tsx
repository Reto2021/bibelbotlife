import { ListMusic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SeriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Predigtreihen</h1>
      <Card>
        <CardHeader>
          <ListMusic className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Serien verwalten</CardTitle>
          <CardDescription>Zusammengehörige Gottesdienste in Reihen organisieren</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kommt in einer nächsten Phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
