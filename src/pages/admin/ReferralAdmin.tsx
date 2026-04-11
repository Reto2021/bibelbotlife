import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, Users, TrendingUp, DollarSign, Plus, Copy, ArrowLeft, ExternalLink } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

export default function ReferralAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", code: "", commission_rate: "0.10", ghl_contact_id: "" });

  const { data: partners, isLoading } = useQuery({
    queryKey: ["referral-partners"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("referral_partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: conversions } = useQuery({
    queryKey: ["referral-conversions"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("referral_conversions")
        .select("*, referral_partners(name, code)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const createPartner = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from as any)("referral_partners").insert({
        name: form.name,
        email: form.email,
        code: form.code.toUpperCase().replace(/\s/g, ""),
        commission_rate: parseFloat(form.commission_rate) || 0.1,
        ghl_contact_id: form.ghl_contact_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-partners"] });
      setOpen(false);
      setForm({ name: "", email: "", code: "", commission_rate: "0.10", ghl_contact_id: "" });
      toast.success("Partner erstellt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalClicks = partners?.reduce((s: number, p: any) => s + (p.total_clicks || 0), 0) || 0;
  const totalConversions = partners?.reduce((s: number, p: any) => s + (p.total_conversions || 0), 0) || 0;
  const totalCommission = partners?.reduce((s: number, p: any) => s + Number(p.total_commission || 0), 0) || 0;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0";

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${code}`);
    toast.success("Link kopiert!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <RouterLink to="/admin"><ArrowLeft className="h-5 w-5" /></RouterLink>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Referral-Partner</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Partner hinzufügen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neuer Referral-Partner</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>E-Mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Referral-Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="z.B. PASTOR2025" /></div>
                <div><Label>Provisionsrate</Label><Input type="number" step="0.01" min="0" max="1" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} /></div>
                <div><Label>GHL Contact-ID (optional)</Label><Input value={form.ghl_contact_id} onChange={e => setForm(f => ({ ...f, ghl_contact_id: e.target.value }))} /></div>
                <Button onClick={() => createPartner.mutate()} disabled={!form.name || !form.email || !form.code || createPartner.isPending} className="w-full">
                  {createPartner.isPending ? "Wird erstellt…" : "Partner erstellen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Partner", value: partners?.length || 0, icon: Users, color: "text-primary" },
            { label: "Klicks", value: totalClicks, icon: Link, color: "text-blue-600" },
            { label: "Conversions", value: totalConversions, icon: TrendingUp, color: "text-green-600" },
            { label: "Provision (CHF)", value: totalCommission.toFixed(0), icon: DollarSign, color: "text-yellow-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />{s.label}
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">Conversion-Rate: {conversionRate}%</p>

        {/* Partners Table */}
        <Card>
          <CardHeader><CardTitle>Partner-Übersicht</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground">Laden…</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Klicks</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">Provision</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Partner-Seite</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners?.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{p.code}</code></TableCell>
                      <TableCell className="text-right">{p.total_clicks || 0}</TableCell>
                      <TableCell className="text-right">{p.total_conversions || 0}</TableCell>
                      <TableCell className="text-right">CHF {Number(p.total_commission || 0).toFixed(0)}</TableCell>
                      <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Aktiv" : "Inaktiv"}</Badge></TableCell>
                      <TableCell>
                        <RouterLink to={`/partner/${p.code}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Öffnen
                        </RouterLink>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => copyLink(p.code)}><Copy className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Conversions Log */}
        <Card>
          <CardHeader><CardTitle>Letzte Conversions</CardTitle></CardHeader>
          <CardContent>
            {!conversions?.length ? <p className="text-muted-foreground text-sm">Noch keine Conversions</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead className="text-right">Deal-Wert</TableHead>
                    <TableHead className="text-right">Provision</TableHead>
                    <TableHead>GHL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString("de-CH")}</TableCell>
                      <TableCell>{c.referral_partners?.name || "–"}</TableCell>
                      <TableCell className="text-right">CHF {Number(c.deal_value || 0).toFixed(0)}</TableCell>
                      <TableCell className="text-right">CHF {Number(c.commission_amount || 0).toFixed(0)}</TableCell>
                      <TableCell>
                        <Badge variant={c.ghl_webhook_status === "sent" ? "default" : c.ghl_webhook_status === "pending" ? "secondary" : "destructive"}>
                          {c.ghl_webhook_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
