import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CeremonyType = "wedding" | "baptism" | "confirmation" | "first_communion" | "firmung";

const SYSTEM_PROMPTS: Record<CeremonyType, (lang: string, formData: Record<string, string>) => string> = {
  wedding: (lang, fd) => `You are a compassionate, experienced writer who helps couples prepare their wedding ceremony texts.

Your task:
- Create a beautiful, personal wedding ceremony text based on the provided information
- Write in ${lang}
- The tone should be warm, joyful, dignified, and deeply personal
- Structure: Opening words → Personal story of the couple → Vows suggestions → Readings/prayers suggestions → Closing blessing
- Keep the text between 500-1000 words
- Do NOT invent facts — only use what is provided
- The text should be suitable to be read aloud or used as a planning basis

${fd.partnerName1 ? `Partner 1: ${fd.partnerName1}` : ""}
${fd.partnerName2 ? `Partner 2: ${fd.partnerName2}` : ""}
${fd.weddingDate ? `Wedding date: ${fd.weddingDate}` : ""}
${fd.venue ? `Venue: ${fd.venue}` : ""}
${fd.tradition ? `Tradition: ${fd.tradition}` : ""}`,

  baptism: (lang, fd) => `You are a warm, caring writer who helps families prepare baptism ceremony texts.

Your task:
- Create a beautiful baptism ceremony text based on the provided information
- Write in ${lang}
- The tone should be warm, welcoming, and full of hope
- Structure: Welcome → About the child/person → Baptismal promises → Prayers → Blessing
- Include suggestions for godparent roles if mentioned
- Keep the text between 400-700 words
- Do NOT invent facts — only use what is provided
- The text should be suitable to share with the pastor

${fd.childName ? `Name of the child/person: ${fd.childName}` : ""}
${fd.birthDate ? `Date of birth: ${fd.birthDate}` : ""}
${fd.parents ? `Parents: ${fd.parents}` : ""}
${fd.godparents ? `Godparents: ${fd.godparents}` : ""}
${fd.tradition ? `Tradition: ${fd.tradition}` : ""}`,

  confirmation: (lang, fd) => `You are a thoughtful writer who helps young people and families prepare confirmation ceremony texts.

Your task:
- Create a personal confirmation text based on the provided information
- Write in ${lang}
- The tone should be encouraging, thoughtful, and appropriate for a young person's milestone
- Structure: Personal reflection → Confirmation verse explanation → Personal prayer → Wishes for the future
- Help find and explain a meaningful confirmation verse if one is provided
- Keep the text between 300-600 words
- Do NOT invent facts — only use what is provided

${fd.confirmandName ? `Confirmand's name: ${fd.confirmandName}` : ""}
${fd.confirmationVerse ? `Chosen confirmation verse: ${fd.confirmationVerse}` : ""}
${fd.hobbies ? `Interests/hobbies: ${fd.hobbies}` : ""}
${fd.tradition ? `Tradition: ${fd.tradition}` : ""}`,

  first_communion: (lang, fd) => `You are a caring writer who helps families prepare First Communion ceremony texts.

Your task:
- Create a beautiful First Communion text based on the provided information
- Write in ${lang}
- The tone should be warm, reverent, and age-appropriate
- Structure: Welcome to the table of the Lord → Personal words about the child → Prayer → Blessing
- Keep the text between 300-500 words
- Do NOT invent facts — only use what is provided

${fd.childName ? `Child's name: ${fd.childName}` : ""}
${fd.parish ? `Parish: ${fd.parish}` : ""}
${fd.communionDate ? `Date: ${fd.communionDate}` : ""}`,

  firmung: (lang, fd) => `You are a thoughtful writer who helps young people prepare Confirmation (Firmung) ceremony texts.

Your task:
- Create a personal Firmung text based on the provided information
- Write in ${lang}
- The tone should be encouraging, spiritual, and appropriate for the young person's faith journey
- Structure: Reflection on faith journey → Firmung name/patron saint → Personal prayer → Commitment
- Keep the text between 300-600 words
- Do NOT invent facts — only use what is provided

${fd.confirmandName ? `Name: ${fd.confirmandName}` : ""}
${fd.firmungName ? `Chosen Firmung name/patron saint: ${fd.firmungName}` : ""}
${fd.sponsor ? `Sponsor: ${fd.sponsor}` : ""}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { ceremonyType, formData, notes, language } = body;

    if (!ceremonyType || !SYSTEM_PROMPTS[ceremonyType as CeremonyType]) {
      return new Response(
        JSON.stringify({ error: `Invalid ceremony type: ${ceremonyType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fd = formData || {};
    const userNotes = notes || "";

    if (!userNotes && Object.keys(fd).filter(k => fd[k]).length < 1) {
      return new Response(
        JSON.stringify({ error: "Please provide some information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const lang = language === "en"
      ? "English"
      : "German (Swiss German style, never use ß, always ss)";

    const systemPrompt = SYSTEM_PROMPTS[ceremonyType as CeremonyType](lang, fd);

    const userContent = userNotes
      ? `Here are the personal notes and wishes:\n\n${userNotes}`
      : `Please create the text based on the provided information.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ceremony-writer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
