import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Fixed sender data
const SENDER = {
  name: "BibleBot.Life",
  street: "Musterstrasse 1",
  zip: "8000",
  city: "Zürich",
  country: "Schweiz",
  email: "billing@biblebot.life",
  iban: "CH00 0000 0000 0000 0000 0",
  uid: "",
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  community: 0,
  gemeinde: 29,
  kirche: 79,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { church_id, line_items, notes, due_days = 30 } = await req.json();

    if (!church_id) {
      return new Response(JSON.stringify({ error: "church_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get church data
    const { data: church, error: churchErr } = await supabase
      .from("church_partners")
      .select("*")
      .eq("id", church_id)
      .single();

    if (churchErr || !church) {
      return new Response(JSON.stringify({ error: "Church not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get billing data from separate table
    const { data: billing } = await supabase
      .from("church_billing")
      .select("*")
      .eq("church_id", church_id)
      .maybeSingle();

    // Calculate amount from line items
    const items = line_items && line_items.length > 0
      ? line_items
      : [
          {
            description: `BibleBot.Life – Plan ${church.plan_tier}`,
            quantity: 1,
            unit_price: PLAN_PRICES[church.plan_tier] || 0,
          },
        ];

    const amount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    );

    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + due_days);

    // Insert invoice
    const { data: invoice, error: insertErr } = await supabase
      .from("invoices")
      .insert({
        church_id,
        invoice_date: invoiceDate.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        amount,
        line_items: items,
        notes: notes || null,
        created_by: church.owner_id || "00000000-0000-0000-0000-000000000000",
      })
      .select()
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate PDF as HTML → convert later if needed; for now return structured data
    const pdfHtml = generateInvoiceHtml(invoice, church, billing, items);

    // Store HTML as a file for now (can be converted to PDF via browser/puppeteer)
    const fileName = `${church_id}/${invoice.invoice_number}.html`;
    const { error: uploadErr } = await supabase.storage
      .from("invoices")
      .upload(fileName, new Blob([pdfHtml], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    let pdfUrl = null;
    if (!uploadErr) {
      const { data: signedUrl } = await supabase.storage
        .from("invoices")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year
      pdfUrl = signedUrl?.signedUrl;

      await supabase
        .from("invoices")
        .update({ pdf_url: pdfUrl })
        .eq("id", invoice.id);
    }

    return new Response(
      JSON.stringify({ invoice: { ...invoice, pdf_url: pdfUrl }, html: pdfHtml }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateInvoiceHtml(
  invoice: any,
  church: any,
  items: any[]
): string {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: invoice.currency || "CHF",
    }).format(n);

  const lineRows = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5">${item.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right">${formatCurrency(item.unit_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right">${formatCurrency(item.quantity * item.unit_price)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Rechnung ${invoice.invoice_number}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #333; margin: 0; padding: 20mm; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .sender { font-size: 9pt; color: #666; }
  .recipient { margin-top: 20px; min-height: 100px; }
  .invoice-meta { text-align: right; }
  .invoice-meta h1 { font-size: 22pt; color: #c97b2a; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 30px; }
  th { background: #f5f0eb; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #c97b2a; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
  th:last-child { text-align: right; }
  .total-row td { font-weight: bold; border-top: 2px solid #333; padding-top: 12px; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="sender">
      <strong>${SENDER.name}</strong><br>
      ${SENDER.street}<br>
      ${SENDER.zip} ${SENDER.city}<br>
      ${SENDER.country}
    </div>
    <div class="recipient" style="margin-top:40px">
      <strong>${church.billing_name || church.name}</strong><br>
      ${church.billing_street || ""}<br>
      ${church.billing_zip || ""} ${church.billing_city || church.city || ""}<br>
      ${church.billing_country || church.country || "CH"}
    </div>
  </div>
  <div class="invoice-meta">
    <h1>Rechnung</h1>
    <p>
      <strong>Nr.:</strong> ${invoice.invoice_number}<br>
      <strong>Datum:</strong> ${formatDate(invoice.invoice_date)}<br>
      <strong>Fällig bis:</strong> ${formatDate(invoice.due_date)}
    </p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Beschreibung</th>
      <th>Menge</th>
      <th>Einzelpreis</th>
      <th>Betrag</th>
    </tr>
  </thead>
  <tbody>
    ${lineRows}
    <tr class="total-row">
      <td colspan="3" style="padding:12px;text-align:right"><strong>Total</strong></td>
      <td style="padding:12px;text-align:right"><strong>${formatCurrency(invoice.amount)}</strong></td>
    </tr>
  </tbody>
</table>

${invoice.notes ? `<p style="margin-top:20px;color:#666">${invoice.notes}</p>` : ""}

<div style="margin-top:40px;padding:16px;background:#f5f0eb;border-radius:8px">
  <strong>Zahlungsinformationen</strong><br>
  IBAN: ${SENDER.iban}<br>
  Empfänger: ${SENDER.name}<br>
  Referenz: ${invoice.invoice_number}
</div>

<div class="footer">
  <div>${SENDER.name} · ${SENDER.street} · ${SENDER.zip} ${SENDER.city}</div>
  <div>${SENDER.email}</div>
</div>
</body>
</html>`;
}
