import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SENDER_PROFILE = {
  name: "Reto Wettstein",
  title: "Gründer, BibleBot.Life",
  phone: "+41 56 544 52 00",
  photo_url: "https://www.reto-wettstein.ch/wp-content/uploads/2022/02/Image-01.jpg",
  signature_html: `
    <p style="margin-top:24px;color:#666;font-size:13px;">
      Herzliche Grüsse<br/>
      <strong>Reto Wettstein</strong><br/>
      Gründer, BibleBot.Life<br/>
      +41 56 544 52 00
    </p>
  `,
  testimonials: [
    "Die Antworten geben uns regelmässig neue und weite Einsichten, die so manches Mal auch bisherige Sichtweisen revidieren. Das fliesst direkt in die Predigtvorbereitung ein – eine echte Bereicherung.",
    "BibleBot hilft uns enorm bei Diskussionen mit Gemeindemitgliedern unterschiedlicher theologischer Prägung. Wir können schnell fundierte, differenzierte Antworten geben und Gespräche auf ein tieferes Niveau bringen.",
    "Seit wir BibleBot nutzen, beschäftigen sich unsere Gemeindemitglieder deutlich häufiger mit der Bibel – auch unter der Woche. Besonders der tägliche Impuls wird sehr geschätzt und sorgt für Gesprächsstoff.",
  ],
  usp: "BibleBot.Life bringt die Bibel direkt in den Alltag Ihrer Gemeindemitglieder – als persönlicher Assistent, der rund um die Uhr verfügbar ist.",
  common_objections: [
    "KI und Glaube passen nicht zusammen",
    "Unsere Gemeinde ist zu klein dafür",
    "Wir haben kein Budget",
    "Unsere Mitglieder sind nicht technikaffin",
  ],
};

// ─── System prompt for TEMPLATE generation (existing) ───
const SEQUENCE_SYSTEM_PROMPT = `Du bist ein erfahrener Cold-Outreach-Experte, spezialisiert auf den kirchlichen Bereich in der Schweiz und Deutschland.

Deine Aufgabe: Erstelle eine psychologisch optimierte 5-Schritt-E-Mail-Sequenz für die Akquise von Kirchgemeinden als Partner für BibleBot.Life.

## BibleBot.Life
${SENDER_PROFILE.usp}

## Psychologische Struktur der 5 Schritte:

### Schritt 1 – Empathie & Neugier (Tag 0)
- Zeige, dass du die Herausforderungen der Gemeinde verstehst
- Persönliche Anknüpfung basierend auf {{personal_note}} (von Website gescrapte Infos)
- Keine Hard-Sell, nur Neugier wecken
- CTA: Frage stellen, kein Termin

### Schritt 2 – Social Proof & Wert (Tag 3)
- Konkrete Erfolgsgeschichte / Testimonial
- Zahlen und Fakten
- CTA: Kurze 10-Minuten-Demo anbieten

### Schritt 3 – Einwandbehandlung (Tag 7)
- Häufige Einwände proaktiv adressieren
- "Viele Pastoren fragen sich..." Format
- CTA: Buchungslink für Demo

### Schritt 4 – Dringlichkeit & Exklusivität (Tag 14)
- Begrenzte Plätze / Early-Adopter-Vorteile
- FOMO: Was andere Gemeinden bereits tun
- CTA: Direkter Buchungslink

### Schritt 5 – Break-up E-Mail (Tag 21)
- Respektvoller Abschluss
- "Kein Problem, falls nicht passend"
- Letzte Chance mit persönlichem Touch
- CTA: Antwort oder Abmeldung

## Regeln:
- Schweizer Deutsch: Kein ß, immer "ss" verwenden
- Du/Sie: Verwende "Sie" (formell)
- Platzhalter MÜSSEN verwendet werden: {{church_name}}, {{contact_name}}, {{city}}, {{personal_note}}, {{booking_url}}, {{sender_name}}
- {{screenshotBlock}} MUSS in mindestens Schritt 1, 2 und 4 eingebaut werden (zeigt ein gebrandetes Widget-Bild mit Link zur Live-Vorschau)
- {{previewUrl}} = Link zur Live-Widget-Vorschau im Branding des Leads
- {{splashUrl}} = Link zur Splash-Page im Branding des Leads
- Jede E-Mail MUSS mit einem klaren CTA enden
- E-Mails als HTML formatieren (einfach, keine aufwändigen Designs)
- Betreffzeilen: Kurz, persönlich, keine Spam-Wörter
- Ton: Warm, professionell, nicht aufdringlich
- Jede E-Mail sollte eigenständig funktionieren (nicht auf vorherige Bezug nehmen)
- Signatur wird automatisch angehängt, NICHT in den Body einbauen

## Antwortformat:
Antworte als JSON-Array mit exakt 5 Objekten:
[
  {
    "step_number": 1,
    "delay_days": 0,
    "subject_template": "...",
    "body_template": "..."
  },
  ...
]`;

// ─── System prompt for PERSONALIZED lead email ───
const PERSONALIZE_SYSTEM_PROMPT = `Du bist ein erfahrener Cold-Outreach-Experte, spezialisiert auf den kirchlichen Bereich in der Schweiz und Deutschland.

Deine Aufgabe: Schreibe eine hochpersonalisierte E-Mail für einen bestimmten Lead basierend auf den verfügbaren Daten (Name, Gemeinde, Stadt, Konfession, gescrapte Website-Daten, persönliche Notizen).

## BibleBot.Life
${SENDER_PROFILE.usp}

## Testimonials (wähle passende aus):
${SENDER_PROFILE.testimonials.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

## Regeln:
- Schweizer Deutsch: Kein ß, immer "ss" verwenden
- Du/Sie: Verwende "Sie" (formell)
- Schreibe eine FERTIGE E-Mail – keine Platzhalter, alle Daten direkt einsetzen
- Die E-Mail muss sich anfühlen, als wäre sie von Hand geschrieben
- Beziehe dich konkret auf Details der Gemeinde (aus gescrapten Daten oder persönlichen Notizen)
- E-Mail als HTML formatieren (einfach, sauber)
- Betreffzeile: Kurz, persönlich, kein Spam
- Ton: Warm, professionell, nicht aufdringlich
- MUSS mit einem klaren CTA enden
- Signatur wird automatisch angehängt, NICHT einbauen

## Antwortformat:
Antworte als JSON-Objekt:
{
  "subject": "...",
  "body": "..."
}`;

async function callAI(lovableKey: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI Gateway error:", response.status, errText);
    if (response.status === 429) throw { status: 429, message: "Rate limit erreicht, bitte versuche es gleich nochmal." };
    if (response.status === 402) throw { status: 402, message: "AI Credits aufgebraucht." };
    throw { status: 500, message: "AI generation failed" };
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { campaign_id, context, mode, lead_id, step_number } = body;

    // ─── MODE: personalize – generate a personalized email for a single lead ───
    if (mode === "personalize") {
      if (!lead_id) {
        return new Response(JSON.stringify({ error: "lead_id required for personalize mode" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: lead, error: leadErr } = await supabase
        .from("outreach_leads")
        .select("*")
        .eq("id", lead_id)
        .single();

      if (leadErr || !lead) {
        return new Response(JSON.stringify({ error: "Lead not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: campaign } = await supabase
        .from("outreach_campaigns")
        .select("*")
        .eq("id", lead.campaign_id)
        .single();

      // Build rich context from lead data
      const scrapedInfo = lead.scraped_data && Object.keys(lead.scraped_data as Record<string, unknown>).length > 0
        ? `\n\nGescrapte Website-Daten:\n${JSON.stringify(lead.scraped_data, null, 2)}`
        : "";

      const targetStep = step_number || (lead.current_step + 1) || 1;

      // Get existing sequence template for context (if any)
      let sequenceHint = "";
      if (campaign) {
        const { data: seqStep } = await supabase
          .from("outreach_sequences")
          .select("*")
          .eq("campaign_id", campaign.id)
          .eq("step_number", targetStep)
          .single();

        if (seqStep) {
          sequenceHint = `\n\nDie generische Vorlage für Schritt ${targetStep} hat diesen Ansatz (nutze als Inspiration, aber personalisiere stark):\nBetreff: ${seqStep.subject_template}\nInhalt-Auszug: ${seqStep.body_template.replace(/<[^>]+>/g, "").slice(0, 300)}`;
        }
      }

      const stepDescriptions: Record<number, string> = {
        1: "Empathie & Neugier – persönliche Anknüpfung, keine Hard-Sell",
        2: "Social Proof & Wert – Erfolgsgeschichte, Demo anbieten",
        3: "Einwandbehandlung – häufige Bedenken proaktiv adressieren",
        4: "Dringlichkeit & Exklusivität – Early-Adopter-Vorteile",
        5: "Break-up E-Mail – respektvoller Abschluss, letzte Chance",
      };

      const userPrompt = `Schreibe eine personalisierte E-Mail (Schritt ${targetStep}: ${stepDescriptions[targetStep] || "Follow-up"}) für:

Gemeinde: ${lead.church_name}
Kontaktperson: ${lead.contact_name || "Pfarrer/Pfarrerin"}
Stadt: ${lead.city || "unbekannt"}
Konfession: ${lead.denomination || "unbekannt"}
Website: ${lead.website || "keine"}
Persönliche Notiz: ${lead.personal_note || "keine"}
${scrapedInfo}

Absender: ${campaign?.sender_name || SENDER_PROFILE.name}
Buchungslink: ${campaign?.booking_url || "https://biblebot.life/demo"}
${sequenceHint}

${context ? `Zusätzlicher Kontext: ${context}` : ""}

Erstelle jetzt die personalisierte E-Mail als JSON mit "subject" und "body".`;

      let content: string;
      try {
        content = await callAI(lovableKey, PERSONALIZE_SYSTEM_PROMPT, userPrompt);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse response
      let result: { subject: string; body: string };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        result = JSON.parse(jsonMatch[0]);
      } catch {
        return new Response(JSON.stringify({ error: "AI response parsing failed", raw: content }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Append signature
      result.body += SENDER_PROFILE.signature_html;

      return new Response(JSON.stringify({
        success: true,
        lead_id,
        step_number: targetStep,
        subject: result.subject,
        body: result.body,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── MODE: default – generate full sequence templates ───
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaign, error: campaignErr } = await supabase
      .from("outreach_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Erstelle eine 5-Schritt-E-Mail-Sequenz für die Kampagne "${campaign.name}".

Absender: ${campaign.sender_name} <${campaign.sender_email}>
Buchungslink: ${campaign.booking_url || "{{booking_url}}"}
Zielgruppe: ${JSON.stringify(campaign.target_criteria)}

${context ? `Zusätzlicher Kontext: ${context}` : ""}

Erstelle jetzt die 5 E-Mail-Schritte als JSON-Array.`;

    let content: string;
    try {
      content = await callAI(lovableKey, SEQUENCE_SYSTEM_PROMPT, userPrompt);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sequences: any[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      sequences = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "AI response parsing failed", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signatureHtml = SENDER_PROFILE.signature_html;

    await supabase.from("outreach_sequences").delete().eq("campaign_id", campaign_id);

    const inserts = sequences.map((seq: any) => ({
      campaign_id,
      step_number: seq.step_number,
      delay_days: seq.delay_days,
      subject_template: seq.subject_template,
      body_template: seq.body_template + signatureHtml,
    }));

    const { error: insertErr } = await supabase.from("outreach_sequences").insert(inserts);

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      steps: sequences.length,
      message: `${sequences.length} Sequenz-Schritte generiert und gespeichert.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Generate sequence error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
