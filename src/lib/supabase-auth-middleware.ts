import { createMiddleware } from "@tanstack/react-start";

/**
 * Client half of server-function auth: attaches the signed-in user's access token
 * as an Authorization header on every server-function call. The server side
 * validates it in requireUser() (src/lib/supabase-server.server.ts).
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? next({ headers: { Authorization: `Bearer ${token}` } }) : next();
});
