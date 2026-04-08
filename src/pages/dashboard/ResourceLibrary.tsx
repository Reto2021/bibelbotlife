import { BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResourceLibrary() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Bibliothek</h1>
      <Card>
        <CardHeader>
          <BookOpen className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Ressourcen-Bibliothek</CardTitle>
          <CardDescription>Lieder, Gebete und Lesungen verwalten</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kommt in einer nächsten Phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
