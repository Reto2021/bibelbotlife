import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Amtshandlungen</h1>
      <Card>
        <CardHeader>
          <FileText className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Register</CardTitle>
          <CardDescription>Taufen, Trauungen, Abdankungen dokumentieren</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Kommt in Phase 6.</p>
        </CardContent>
      </Card>
    </div>
  );
}
