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

      // Process each message
      for (const row of rows) {
        if (!row.text) continue;
        
        try {
          // Handle /daily command
          if (row.text.trim().toLowerCase().startsWith('/daily')) {
            await handleDailyCommand(row.chat_id, row.text, LOVABLE_API_KEY, TELEGRAM_API_KEY, supabase);
            continue;
          }
          // Handle /stopdaily command
          if (row.text.trim().toLowerCase().startsWith('/stopdaily')) {
            await handleStopDailyCommand(row.chat_id, LOVABLE_API_KEY, TELEGRAM_API_KEY, supabase);
            continue;
          }
          // Handle /start command
          if (row.text.trim().toLowerCase() === '/start') {
            await sendTelegramMessage(row.chat_id, 
              "Willkommen bei BibelBot! 🙏\n\nIch bin dein persönlicher Begleiter mit der Bibel.\n\n" +
              "*Befehle:*\n" +
              "/daily – Täglichen Bibelimpuls um 07:00 abonnieren\n" +
              "/daily Thomas – Mit persönlicher Begrüssung\n" +
              "/stopdaily – Täglichen Impuls abbestellen\n\n" +
              "Oder schreib mir einfach – ich bin hier für dich. 💛",
              LOVABLE_API_KEY, TELEGRAM_API_KEY
            );
            continue;
          }
          
          await generateAndSendReply(row.chat_id, row.text, LOVABLE_API_KEY, TELEGRAM_API_KEY, supabase);
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
  supabase: any
) {
  // Fetch last 50 messages from this chat for conversation context
  const { data: history } = await supabase
    .from('telegram_messages')
    .select('text, role, created_at')
    .eq('chat_id', chatId)
    .not('text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  const allMessages = (history || []).reverse();

  // Check if there are older messages beyond the 50 we fetched
  const { count: totalCount } = await supabase
    .from('telegram_messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId)
    .not('text', 'is', null);

  let summaryPrefix = "";
  if (totalCount && totalCount > 50) {
    // Fetch the oldest messages that are NOT in our 50-message window for summarization
    const oldestInWindow = allMessages[0]?.created_at;
    const { data: olderMessages } = await supabase
      .from('telegram_messages')
      .select('text, role')
      .eq('chat_id', chatId)
      .not('text', 'is', null)
      .lt('created_at', oldestInWindow)
      .order('created_at', { ascending: true })
      .limit(100);

    if (olderMessages && olderMessages.length > 0) {
      // Generate a summary of older conversation
      const olderText = olderMessages
        .map((m: any) => `${m.role === 'assistant' ? 'Bot' : 'User'}: ${m.text}`)
        .join('\n');

      const summaryResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Fasse das folgende Gespräch in 3-5 Sätzen zusammen. Fokus auf: Hauptthemen, persönliche Situation des Nutzers, wichtige Erkenntnisse, offene Fragen. Deutsch (Schweiz), kein ß."
              },
              { role: "user", content: olderText }
            ],
            stream: false,
          }),
        }
      );

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summaryPrefix = summaryData.choices?.[0]?.message?.content || "";
      }
    }
  }

  // Build conversation messages from history
  const conversationMessages = allMessages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.text,
  }));

  // Call AI with full conversation context + optional summary
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
            content: `Du bist BibelBot – ein einfühlsamer, weiser Begleiter für Menschen, die an der Bibel wachsen wollen. Du sprichst Deutsch (Schweiz), kein ß. Halte Antworten unter 4000 Zeichen (Telegram-Limit). Verwende Markdown-Formatierung sparsam (Telegram unterstützt nur *bold*, _italic_, \`code\`). Antworte fokussiert und warmherzig. Du erinnerst dich an den bisherigen Gesprächsverlauf.${summaryPrefix ? `\n\n[ZUSAMMENFASSUNG FRÜHERER GESPRÄCHE]\n${summaryPrefix}\n[ENDE ZUSAMMENFASSUNG]` : ""}`
          },
          ...conversationMessages,
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

  // Store bot reply in telegram_messages for future context
  await supabase.from('telegram_messages').insert({
    update_id: Date.now(),
    chat_id: chatId,
    text: replyText,
    role: 'assistant',
    raw_update: { type: 'bot_reply', chat_id: chatId },
  });

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

async function sendTelegramMessage(
  chatId: number,
  text: string,
  lovableApiKey: string,
  telegramApiKey: string,
) {
  const resp = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': telegramApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  if (!resp.ok) {
    await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'X-Connection-Api-Key': telegramApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}

async function handleDailyCommand(
  chatId: number,
  text: string,
  lovableApiKey: string,
  telegramApiKey: string,
  supabase: any,
) {
  const parts = text.trim().split(/\s+/);
  const firstName = parts.length > 1 ? parts.slice(1).join(' ').slice(0, 50) : null;

  const { data: existing } = await supabase
    .from('daily_subscribers')
    .select('id, is_active')
    .eq('channel', 'telegram')
    .eq('telegram_chat_id', chatId)
    .maybeSingle();

  if (existing && existing.is_active) {
    await sendTelegramMessage(chatId,
      "Du bist bereits für den täglichen Impuls angemeldet! 🙏\n\nJeden Morgen um 07:00 erhältst du deinen Vers." +
      (firstName ? `\n\nIch habe deinen Namen aktualisiert: ${firstName}` : "") +
      "\n\nMit /stopdaily kannst du abbestellen.",
      lovableApiKey, telegramApiKey
    );
    if (firstName && existing) {
      await supabase.from('daily_subscribers')
        .update({ first_name: firstName, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
    return;
  }

  if (existing && !existing.is_active) {
    await supabase.from('daily_subscribers')
      .update({ is_active: true, first_name: firstName, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    const record: Record<string, unknown> = {
      channel: 'telegram',
      telegram_chat_id: chatId,
      is_active: true,
    };
    if (firstName) record.first_name = firstName;
    await supabase.from('daily_subscribers').insert(record);
  }

  const greeting = firstName ? `Hallo ${firstName}! ` : "";
  await sendTelegramMessage(chatId,
    `${greeting}Du bist jetzt für den täglichen Bibelimpuls angemeldet! 🙏\n\n` +
    "Ab morgen um *07:00 Uhr* erhältst du jeden Tag einen Vers mit Impuls.\n\n" +
    "Mit /stopdaily kannst du jederzeit abbestellen.",
    lovableApiKey, telegramApiKey
  );
}

async function handleStopDailyCommand(
  chatId: number,
  lovableApiKey: string,
  telegramApiKey: string,
  supabase: any,
) {
  const { data: existing } = await supabase
    .from('daily_subscribers')
    .select('id')
    .eq('channel', 'telegram')
    .eq('telegram_chat_id', chatId)
    .eq('is_active', true)
    .maybeSingle();

  if (!existing) {
    await sendTelegramMessage(chatId,
      "Du bist aktuell nicht für den täglichen Impuls angemeldet.\n\nMit /daily kannst du dich anmelden. 🙏",
      lovableApiKey, telegramApiKey
    );
    return;
  }

  await supabase.from('daily_subscribers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', existing.id);

  await sendTelegramMessage(chatId,
    "Dein täglicher Impuls wurde abbestellt. 🙏\n\nDu kannst dich jederzeit mit /daily wieder anmelden.\n\nIch bin weiterhin hier für Gespräche! 💛",
    lovableApiKey, telegramApiKey
  );
}
