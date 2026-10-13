import { createClient, type User } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export function serverEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable ${name}`);
  return value;
}

/** Service-role client — bypasses RLS. Server-only; build per request. */
export function createAdminClient() {
  return createClient<Database>(serverEnv("SUPABASE_URL"), serverEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Validates the caller's bearer token (attached by attachSupabaseAuth) and returns the user. */
export async function requireUser(): Promise<User> {
  const authHeader = getRequestHeader("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) throw new Error("unauthorized");
  const client = createClient<Database>(serverEnv("SUPABASE_URL"), serverEnv("SUPABASE_PUBLISHABLE_KEY"), {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("unauthorized");
  return data.user;
}
