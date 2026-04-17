import { useState, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Play, Copy, Trash2, Archive, Eye, MoreHorizontal, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useLessons } from "@/hooks/use-lessons";
import { useDeleteService, useDuplicateService, useUpdateServiceStatus } from "@/hooks/use-services";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const LESSON_TYPE_LABELS: Record<string, string> = {
  lesson: "Einzelstunde",
  double_lesson: "Doppelstunde",
  project_day: "Projekttag",
  confirmation_class: "Konfirmandenunterricht",
};

const LESSON_TYPE_COLORS: Record<string, string> = {
  lesson: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  double_lesson: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  project_day: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  confirmation_class: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
};

type ViewMode = "list" | "week";

export default function LessonsPage() {
  const { data: lessons, isLoading } = useLessons();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const routerNavigate = useNavigate();
  const deleteService = useDeleteService();
  const duplicateService = useDuplicateService();
  const updateStatus = useUpdateServiceStatus();

  const lessonsByDate = useMemo(() => {
    const map: Record<string, typeof lessons> = {};
    lessons?.forEach((s) => {
      const key = s.service_date;
      if (!map[key]) map[key] = [];
      map[key]!.push(s);
    });
    return map;
  }, [lessons]);

  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const today = new Date().toISOString().split("T")[0];
  const formatDateKey = (d: Date) => d.toISOString().split("T")[0];

  const upcomingLessons = useMemo(() => {
    return (lessons ?? []).filter((l) => l.service_date >= today).slice(0, 50);
  }, [lessons, today]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Unterrichtsplaner</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md">
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="rounded-r-none h-8" onClick={() => setViewMode("list")}>
              <CalendarDays className="h-4 w-4 mr-1" /> Liste
            </Button>
            <Button variant={viewMode === "week" ? "secondary" : "ghost"} size="sm" className="rounded-l-none h-8" onClick={() => setViewMode("week")}>
              <CalendarRange className="h-4 w-4 mr-1" /> Woche
            </Button>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard/editor/new?type=lesson">
              <Plus className="h-4 w-4 mr-1" /> Neue Lektion
            </Link>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Plane Religionsunterricht, Konfirmanden- und Projekttage. Gleicher Editor wie Gottesdienste — nur mit Unterrichts-Bausteinen.
      </p>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Lade Lektionen...</div>
      ) : viewMode === "list" ? (
        upcomingLessons.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground space-y-3">
              <GraduationCap className="h-10 w-10 mx-auto opacity-40" />
              <p className="text-sm">Noch keine Lektionen geplant.</p>
              <Button asChild size="sm">
                <Link to="/dashboard/editor/new?type=lesson">
                  <Plus className="h-4 w-4 mr-1" /> Erste Lektion erstellen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingLessons.map((s) => (
              <Card key={s.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/dashboard/editor/${s.id}`} className="block">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px]", LESSON_TYPE_COLORS[s.service_type])}>
                          {LESSON_TYPE_LABELS[s.service_type] || s.service_type}
                        </Badge>
                        {(s as any).class_name && (
                          <Badge variant="secondary" className="text-[10px]">{(s as any).class_name}</Badge>
                        )}
                        <span className="text-sm font-medium truncate">{s.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(s.service_date).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })}
                        {s.service_time && ` · ${s.service_time.slice(0, 5)}`}
                        {(s as any).duration_minutes && ` · ${(s as any).duration_minutes} Min.`}
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Live starten">
                      <Link to={`/dashboard/conductor/${s.id}`}><Play className="h-4 w-4 text-primary" /></Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          try {
                            const result = await duplicateService.mutateAsync(s.id);
                            toast.success("Kopiert");
                            routerNavigate(`/dashboard/editor/${result.id}`);
                          } catch { toast.error("Fehler"); }
                        }}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Kopieren
                        </DropdownMenuItem>
                        {s.status !== "archived" && (
                          <DropdownMenuItem onClick={async () => {
                            await updateStatus.mutateAsync({ id: s.id, status: "archived" });
                            toast.success("Archiviert");
                          }}>
                            <Archive className="h-3.5 w-3.5 mr-2" /> Archivieren
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          if (confirm(`«${s.title}» wirklich löschen?`)) {
                            await deleteService.mutateAsync(s.id);
                            toast.success("Gelöscht");
                          }
                        }}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        // Week view
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
              <div className="text-center">
                <h2 className="text-sm font-semibold text-foreground">
                  Woche vom {weekDays[0].toLocaleDateString("de-CH", { day: "numeric", month: "long" })}
                </h2>
                <Button variant="link" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())}>Heute</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-5 w-5" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, i) => {
                const key = formatDateKey(date);
                const dayLessons = lessonsByDate[key];
                const isToday = key === today;
                return (
                  <div key={i} className="space-y-2">
                    <div className={cn("text-center pb-2 border-b border-border", isToday && "text-primary font-bold")}>
                      <div className="text-xs text-muted-foreground">{WEEKDAYS[i]}</div>
                      <div className={cn("text-lg w-8 h-8 mx-auto flex items-center justify-center rounded-full", isToday && "bg-primary text-primary-foreground")}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-1 min-h-[160px]">
                      {dayLessons?.map((s) => (
                        <Link key={s.id} to={`/dashboard/editor/${s.id}`}>
                          <Card className="p-2 hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="text-xs font-medium truncate">{s.title}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {s.service_time?.slice(0, 5)}
                              {(s as any).class_name && ` · ${(s as any).class_name}`}
                            </div>
                          </Card>
                        </Link>
                      ))}
                      {!dayLessons?.length && (
                        <Link to={`/dashboard/editor/new?type=lesson&date=${key}`} className="block">
                          <div className="border border-dashed border-border rounded-md p-2 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Plus className="h-3 w-3 mx-auto text-muted-foreground" />
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick-create */}
      <div className="flex flex-wrap gap-2 pt-2">
        <span className="text-xs text-muted-foreground self-center">Schnell anlegen:</span>
        {Object.entries(LESSON_TYPE_LABELS).map(([key, label]) => (
          <Link key={key} to={`/dashboard/editor/new?type=${key}`}>
            <Badge variant="outline" className={cn("text-xs cursor-pointer hover:opacity-80 transition-opacity", LESSON_TYPE_COLORS[key])}>
              {label}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
