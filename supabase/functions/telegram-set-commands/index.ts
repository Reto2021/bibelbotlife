import { corsHeaders } from '@supabase/supabase-js/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

  const commands = [
    { command: 'start', description: 'Willkommen & Übersicht' },
    { command: 'daily', description: 'Täglichen Bibelimpuls abonnieren' },
    { command: 'stopdaily', description: 'Täglichen Impuls abbestellen' },
  ];

  const response = await fetch(`${GATEWAY_URL}/setMyCommands`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': TELEGRAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ commands }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: response.ok ? 200 : 502,
  });
});
