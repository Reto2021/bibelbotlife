import { useState, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Play, Copy, Trash2, Archive, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useServices, useDeleteService, useDuplicateService, useUpdateServiceStatus } from "@/hooks/use-services";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const SERVICE_TYPE_LABELS: Record<string, string> = {
  regular: "Gottesdienst",
  baptism: "Taufe",
  wedding: "Trauung",
  funeral: "Abdankung",
  confirmation: "Konfirmation",
  communion: "Abendmahl",
  special: "Spezial",
  other: "Anderes",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  regular: "bg-primary/20 text-primary",
  baptism: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  wedding: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
  funeral: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
  confirmation: "bg-green-500/20 text-green-700 dark:text-green-300",
  communion: "bg-red-500/20 text-red-700 dark:text-red-300",
  special: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  other: "bg-muted text-muted-foreground",
};

type ViewMode = "month" | "week";

export default function ServicesCalendar() {
  const { data: services, isLoading } = useServices();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get services indexed by date string
  const servicesByDate = useMemo(() => {
    const map: Record<string, typeof services> = {};
    services?.forEach((s) => {
      const key = s.service_date;
      if (!map[key]) map[key] = [];
      map[key]!.push(s);
    });
    return map;
  }, [services]);

  // Month view: get all days to display
  const monthDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday = 0 in our grid
    let startOffset = (firstDay.getDay() + 6) % 7;
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Next month padding to fill 6 rows
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - startOffset - lastDay.getDate() + 1);
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  // Week view: get 7 days of current week
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setDate(d.getDate() + dir * 7);
    }
    setCurrentDate(d);
  };

  const today = new Date().toISOString().split("T")[0];

  const formatDateKey = (d: Date) => d.toISOString().split("T")[0];

  const renderServiceBadge = (service: any) => (
    <Link
      key={service.id}
      to={`/dashboard/editor/${service.id}`}
      className="block"
    >
      <div className={cn("text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity", SERVICE_TYPE_COLORS[service.service_type] || SERVICE_TYPE_COLORS.other)}>
        {service.service_time?.slice(0, 5)} {service.title}
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none h-8"
              onClick={() => setViewMode("month")}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Monat
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none h-8"
              onClick={() => setViewMode("week")}
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              Woche
            </Button>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard/editor/new">
              <Plus className="h-4 w-4 mr-1" />
              Neu
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {viewMode === "month"
              ? `${MONTHS[month]} ${year}`
              : `Woche vom ${weekDays[0].toLocaleDateString("de-CH", { day: "numeric", month: "long" })}`
            }
          </h2>
          <Button variant="link" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())}>
            Heute
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Lade Gottesdienste...</div>
      ) : viewMode === "month" ? (
        /* Month View */
        <Card>
          <CardContent className="p-2 sm:p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {monthDays.map(({ date, isCurrentMonth }, i) => {
                const key = formatDateKey(date);
                const dayServices = servicesByDate[key];
                const isToday = key === today;
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] p-1 bg-background",
                      !isCurrentMonth && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayServices?.slice(0, 3).map(renderServiceBadge)}
                      {dayServices && dayServices.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">+{dayServices.length - 3} mehr</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Week View */
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, i) => {
                const key = formatDateKey(date);
                const dayServices = servicesByDate[key];
                const isToday = key === today;
                return (
                  <div key={i} className="space-y-2">
                    <div className={cn(
                      "text-center pb-2 border-b border-border",
                      isToday && "text-primary font-bold"
                    )}>
                      <div className="text-xs text-muted-foreground">{WEEKDAYS[i]}</div>
                      <div className={cn(
                        "text-lg w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground"
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-1 min-h-[200px]">
                      {dayServices?.map((s) => (
                        <Link key={s.id} to={`/dashboard/editor/${s.id}`}>
                          <Card className="p-2 hover:border-primary/50 transition-colors cursor-pointer">
                            <div className="text-xs font-medium truncate">{s.title}</div>
                            <div className="text-[10px] text-muted-foreground">{s.service_time?.slice(0, 5)}</div>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="outline" className={cn("text-[10px]", SERVICE_TYPE_COLORS[s.service_type])}>
                                {SERVICE_TYPE_LABELS[s.service_type] || s.service_type}
                              </Badge>
                              <Link
                                to={`/dashboard/conductor/${s.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:text-primary/80"
                                title="Live starten"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </Card>
                        </Link>
                      ))}
                      {!dayServices?.length && (
                        <Link to={`/dashboard/editor/new`} className="block">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
          <Badge key={key} variant="outline" className={cn("text-xs", SERVICE_TYPE_COLORS[key])}>
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
