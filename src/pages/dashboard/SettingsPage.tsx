import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>
      <Card>
        <CardHeader>
          <Settings className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Gemeinde & Tradition</CardTitle>
          <CardDescription>Gemeindeprofil, Konfession und Präferenzen</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kommt in einer nächsten Phase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
