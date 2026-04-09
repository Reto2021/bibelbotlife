import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Platzhalter für persönliche Daten (später ersetzen) ───
const SENDER_PROFILE = {
  name: "{{DEIN_NAME}}",
  title: "{{DEIN_TITEL}}",
  phone: "{{DEINE_TELEFONNUMMER}}",
  photo_url: "{{DEIN_PORTRAIT_URL}}",
  signature_html: `
    <p style="margin-top:24px;color:#666;font-size:13px;">
      Herzliche Grüsse<br/>
      <strong>{{DEIN_NAME}}</strong><br/>
      {{DEIN_TITEL}}<br/>
      BibleBot.Life<br/>
      {{DEINE_TELEFONNUMMER}}
    </p>
  `,
  // Testimonials / Social Proof (später mit echten Daten füllen)
  testimonials: [
    "{{TESTIMONIAL_1}}",
    "{{TESTIMONIAL_2}}",
    "{{TESTIMONIAL_3}}",
  ],
  usp: "BibleBot.Life bringt die Bibel direkt in den Alltag Ihrer Gemeindemitglieder – als persönlicher KI-Assistent, der rund um die Uhr verfügbar ist.",
  common_objections: [
    "KI und Glaube passen nicht zusammen",
    "Unsere Gemeinde ist zu klein dafür",
    "Wir haben kein Budget",
    "Unsere Mitglieder sind nicht technikaffin",
  ],
};

const SYSTEM_PROMPT = `Du bist ein erfahrener Cold-Outreach-Experte, spezialisiert auf den kirchlichen Bereich in der Schweiz und Deutschland.

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

    const { campaign_id, context } = await req.json();

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get campaign details
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

    // Build context for AI
    const userPrompt = `Erstelle eine 5-Schritt-E-Mail-Sequenz für die Kampagne "${campaign.name}".

Absender: ${campaign.sender_name} <${campaign.sender_email}>
Buchungslink: ${campaign.booking_url || "{{booking_url}}"}
Zielgruppe: ${JSON.stringify(campaign.target_criteria)}

${context ? `Zusätzlicher Kontext: ${context}` : ""}

Erstelle jetzt die 5 E-Mail-Schritte als JSON-Array.`;

    // Call Lovable AI
    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht, bitte versuche es gleich nochmal." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let sequences: any[];
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      sequences = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI response parsing failed", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Append signature to each body_template
    const signatureHtml = SENDER_PROFILE.signature_html
      .replace(/\{\{DEIN_NAME\}\}/g, campaign.sender_name || SENDER_PROFILE.name)
      .replace(/\{\{DEIN_TITEL\}\}/g, SENDER_PROFILE.title)
      .replace(/\{\{DEINE_TELEFONNUMMER\}\}/g, SENDER_PROFILE.phone);

    // Delete existing sequences for this campaign
    await supabase
      .from("outreach_sequences")
      .delete()
      .eq("campaign_id", campaign_id);

    // Insert new sequences
    const inserts = sequences.map((seq: any) => ({
      campaign_id,
      step_number: seq.step_number,
      delay_days: seq.delay_days,
      subject_template: seq.subject_template,
      body_template: seq.body_template + signatureHtml,
    }));

    const { error: insertErr } = await supabase
      .from("outreach_sequences")
      .insert(inserts);

    if (insertErr) {
      console.error("Insert error:", insertErr);
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
