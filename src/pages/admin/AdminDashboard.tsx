import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminStats, useAdminChurches } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, TrendingUp, AlertTriangle, MessageCircle, Search, Target, Heart, Link as LinkIcon } from "lucide-react";
import { ChurchDetailDrawer } from "./ChurchDetailDrawer";
import type { Tables } from "@/integrations/supabase/types";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  community: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  gemeinde: "bg-primary/20 text-primary",
  kirche: "bg-secondary/20 text-secondary",
};

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  expired: "bg-destructive/20 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function AdminDashboard() {
  const { data: stats } = useAdminStats();
  const { data: churches, isLoading } = useAdminChurches();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedChurch, setSelectedChurch] = useState<Tables<"church_partners"> | null>(null);

  const filtered = useMemo(() => {
    if (!churches) return [];
    return churches.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "all" || c.plan_tier === planFilter;
      const matchStatus = statusFilter === "all" || c.subscription_status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [churches, search, planFilter, statusFilter]);

  const statCards = [
    { label: "Gemeinden", value: stats?.totalChurches ?? "–", icon: Building2, color: "text-primary" },
    { label: "Aktive Abos", value: stats?.activeSubscriptions ?? "–", icon: TrendingUp, color: "text-green-600" },
    { label: "Ablaufend (30d)", value: stats?.expiringSoon ?? "–", icon: AlertTriangle, color: "text-yellow-600" },
    { label: "Abonnenten", value: stats?.totalSubscribers ?? "–", icon: Users, color: "text-secondary" },
    { label: "Chats heute", value: stats?.todayMessages ?? "–", icon: MessageCircle, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <Button asChild variant="outline">
            <RouterLink to="/admin/outreach"><Target className="h-4 w-4 mr-2" />Cold Outreach</RouterLink>
          </Button>
          <Button asChild variant="outline">
            <RouterLink to="/admin/referrals"><Link className="h-4 w-4 mr-2" />Referrals</RouterLink>
          </Button>
          <Button asChild variant="outline">
            <RouterLink to="/admin/prayers"><Heart className="h-4 w-4 mr-2" />Gebete</RouterLink>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Name oder Stadt…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Pläne</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="gemeinde">Gemeinde</SelectItem>
              <SelectItem value="kirche">Kirche</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
              <SelectItem value="cancelled">Gekündigt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Stadt</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Ablauf</TableHead>
                  <TableHead className="hidden lg:table-cell">Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Lade Gemeinden…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Keine Gemeinden gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedChurch(c)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {!c.is_active && <span className="h-2 w-2 rounded-full bg-destructive" title="Inaktiv" />}
                          {c.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{c.city ?? "–"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={PLAN_COLORS[c.plan_tier] ?? ""}>
                          {c.plan_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_COLORS[c.subscription_status ?? "trial"] ?? ""}>
                          {c.subscription_status ?? "trial"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {c.subscription_expires_at
                          ? new Date(c.subscription_expires_at).toLocaleDateString("de-CH")
                          : "–"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("de-CH")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ChurchDetailDrawer
        church={selectedChurch}
        open={!!selectedChurch}
        onClose={() => setSelectedChurch(null)}
      />
    </div>
  );
}
