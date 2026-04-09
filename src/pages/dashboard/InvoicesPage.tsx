import { useState } from "react";
import { Plus, Download, Send, FileText, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserChurch } from "@/hooks/use-user-church";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Entwurf", variant: "secondary" },
  sent: { label: "Gesendet", variant: "default" },
  paid: { label: "Bezahlt", variant: "outline" },
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const { data: church } = useUserChurch();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const { data: billing } = useQuery({
    queryKey: ["church-billing", church?.id],
    enabled: !!church?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("church_billing")
        .select("*")
        .eq("church_id", church!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", church?.id],
    queryFn: async () => {
      if (!church?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!church?.id,
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleGenerate = async () => {
    if (!church?.id) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: {
          church_id: church.id,
          line_items: lineItems.filter((i) => i.description.trim()),
          notes: notes || undefined,
        },
      });

      if (error) throw error;

      if (data?.html) {
        const blob = new Blob([data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }

      toast.success(`Rechnung ${data?.invoice?.invoice_number} erstellt`);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDialogOpen(false);
      setLineItems([{ description: "", quantity: 1, unit_price: 0 }]);
      setNotes("");
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Rechnung konnte nicht erstellt werden"));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (invoice: any) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, "_blank");
    } else {
      toast.error("Keine PDF verfügbar");
    }
  };

  const handleSendEmail = async (invoice: any) => {
    const recipientEmail = billing?.billing_email || church?.contact_email;
    if (!recipientEmail) {
      toast.error("Keine Rechnungs-E-Mail hinterlegt");
      return;
    }

    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-notification",
          recipientEmail,
          idempotencyKey: `invoice-${invoice.id}`,
          templateData: {
            churchName: church!.name,
            invoiceNumber: invoice.invoice_number,
            amount: new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(invoice.amount),
            dueDate: new Date(invoice.due_date).toLocaleDateString("de-CH"),
            downloadUrl: invoice.pdf_url,
          },
        },
      });

      await supabase
        .from("invoices")
        .update({ status: "sent" as any })
        .eq("id", invoice.id);

      toast.success("Rechnung per E-Mail gesendet");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch {
      toast.error("E-Mail konnte nicht gesendet werden");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(n);

  if (!church) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Keine Gemeinde zugewiesen
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rechnungen</h1>
          <p className="text-muted-foreground">Rechnungen erstellen, herunterladen und versenden</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Rechnung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Rechnung erstellen</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <strong>Empfänger:</strong> {billing?.billing_name || church.name}
                {billing?.billing_street && <>, {billing.billing_street}</>}
                {billing?.billing_zip && <>, {billing.billing_zip}</>}
                {billing?.billing_city && <> {billing.billing_city}</>}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Positionen</Label>
                {lineItems.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Beschreibung"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Menge"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(i, "quantity", Number(e.target.value))}
                      className="w-20"
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Preis"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(i, "unit_price", Number(e.target.value))}
                      className="w-28"
                      min={0}
                      step={0.01}
                    />
                    {lineItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeLineItem(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-3 w-3 mr-1" /> Position hinzufügen
                </Button>
              </div>

              <div className="text-right text-lg font-semibold">
                Total: {formatCurrency(total)}
              </div>

              <div>
                <Label htmlFor="notes">Bemerkungen (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Hinweise auf der Rechnung..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleGenerate} disabled={generating || total <= 0}>
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Rechnung erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alle Rechnungen</CardTitle>
          <CardDescription>
            {invoices.length} {invoices.length === 1 ? "Rechnung" : "Rechnungen"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Noch keine Rechnungen erstellt</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr.</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Fällig</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => {
                  const statusInfo = STATUS_BADGES[inv.status] || STATUS_BADGES.draft;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                      <TableCell>{formatDate(inv.due_date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(inv)} title="Herunterladen">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleSendEmail(inv)} title="Per E-Mail senden">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
