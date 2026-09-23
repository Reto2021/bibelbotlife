import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Cron jobs authenticate with a shared secret stored in a private table
// (never in the cron command itself). They send it via the x-cron-key header.
export async function verifyCronKey(req: Request): Promise<boolean> {
  const cronKey = req.headers.get("x-cron-key") ?? "";
  if (!cronKey) return false;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.rpc("check_cron_key", { candidate: cronKey });
  if (error) {
    console.error("verifyCronKey failed:", error.message);
    return false;
  }
  return data === true;
}

export async function requireAdminOrService(
  req: Request,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : "";
  const unauthorized = new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
  if (!token) {
    if (await verifyCronKey(req)) return { ok: true };
    return { ok: false, response: unauthorized };
  }
  if (token === serviceKey) return { ok: true };
  if (await verifyCronKey(req)) return { ok: true };

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userRes, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userRes?.user) return { ok: false, response: unauthorized };

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  return { ok: true };
}

export async function requireUser(
  req: Request,
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : "";
  const unauthorized = new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
  if (!token) return { ok: false, response: unauthorized };
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userRes, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userRes?.user) return { ok: false, response: unauthorized };
  return { ok: true, userId: userRes.user.id };
}

export async function requireUserOrService(
  req: Request,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : "";
  const unauthorized = new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
  if (!token) return { ok: false, response: unauthorized };
  if (token === serviceKey) return { ok: true };
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userRes, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userRes?.user) return { ok: false, response: unauthorized };
  return { ok: true };
}
