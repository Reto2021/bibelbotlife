import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

Deno.serve(async () => {
  const startTime = Date.now();

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;
  let currentOffset: number;

  // Read initial offset
  const { data: state, error: stateErr } = await supabase
    .from('telegram_bot_state')
    .select('update_offset')
    .eq('id', 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500 });
  }

  currentOffset = state.update_offset;

  // Poll continuously until time runs out
  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;

    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ['message'],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Telegram getUpdates error:', data);
      return new Response(JSON.stringify({ error: data }), { status: 502 });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) continue;

    // Store messages (upsert for idempotency)
    const rows = updates
      .filter((u: any) => u.message)
      .map((u: any) => ({
        update_id: u.update_id,
        chat_id: u.message.chat.id,
        text: u.message.text ?? null,
        raw_update: u,
      }));

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from('telegram_messages')
        .upsert(rows, { onConflict: 'update_id' });

      if (insertErr) {
        console.error('Insert error:', insertErr);
        return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
      }

      // Process each message and send AI reply
      for (const row of rows) {
        if (!row.text) continue;
        
        try {
          await generateAndSendReply(row.chat_id, row.text, LOVABLE_API_KEY, TELEGRAM_API_KEY, supabaseUrl);
        } catch (err) {
          console.error(`Failed to reply to chat ${row.chat_id}:`, err);
        }
      }

      totalProcessed += rows.length;
    }

    // Advance offset
    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;

    const { error: offsetErr } = await supabase
      .from('telegram_bot_state')
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (offsetErr) {
      console.error('Offset update error:', offsetErr);
      return new Response(JSON.stringify({ error: offsetErr.message }), { status: 500 });
    }

    currentOffset = newOffset;
  }

  return new Response(JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }));
});

async function generateAndSendReply(
  chatId: number,
  userText: string,
  lovableApiKey: string,
  telegramApiKey: string,
  supabaseUrl: string
) {
  // Call bibelbot-chat (non-streaming for simplicity in Telegram context)
  const chatResponse = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Du bist BibelBot – ein einfühlsamer, weiser Begleiter für Menschen, die an der Bibel wachsen wollen. Du sprichst Deutsch (Schweiz), kein ß. Halte Antworten unter 4000 Zeichen (Telegram-Limit). Verwende Markdown-Formatierung sparsam (Telegram unterstützt nur *bold*, _italic_, \`code\`). Antworte fokussiert und warmherzig.`
          },
          { role: "user", content: userText },
        ],
        stream: false,
      }),
    }
  );

  if (!chatResponse.ok) {
    const errText = await chatResponse.text();
    throw new Error(`AI gateway error [${chatResponse.status}]: ${errText}`);
  }

  const chatData = await chatResponse.json();
  const replyText = chatData.choices?.[0]?.message?.content || "Entschuldige, ich konnte gerade keine Antwort generieren. Bitte versuche es nochmal.";

  // Send reply via Telegram
  const sendResponse = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': telegramApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: replyText,
      parse_mode: 'Markdown',
    }),
  });

  if (!sendResponse.ok) {
    // Retry without parse_mode in case Markdown is invalid
    const retryResponse = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'X-Connection-Api-Key': telegramApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
      }),
    });

    if (!retryResponse.ok) {
      const errData = await retryResponse.json();
      throw new Error(`Telegram sendMessage failed [${retryResponse.status}]: ${JSON.stringify(errData)}`);
    }
  }
}
