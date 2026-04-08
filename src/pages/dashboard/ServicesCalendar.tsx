import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ServicesCalendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
        <Button asChild>
          <Link to="/dashboard/editor/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Gottesdienst
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <Calendar className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Kalender-Ansicht</CardTitle>
          <CardDescription>Wird in Phase 4 implementiert</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Hier erscheint die Monats-/Wochen-Ansicht aller Gottesdienste.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
