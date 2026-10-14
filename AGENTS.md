# AGENTS.md

- Framework is TanStack Start (file routes in `src/routes/`, root shell/providers in `src/routes/__root.tsx`); pages stay in `src/pages/` and route files only import and wrap them — keeps page code reusable and route files thin.
- Navigation imports go through `@/lib/router-compat` (react-router calling conventions over TanStack Router) — avoids rewriting every call site; native TanStack APIs are fine for new code.
- Auth guards (`ProtectedRoute`, `ProtectedAdminRoute`, `ProtectedDashboardRoute`) wrap the page inside each route file (or the layout `route.tsx` for nested areas) — protection must stay visible per route.
- Pages are server-rendered: never read `window`/`localStorage`/`sessionStorage`/`navigator` during render or in `useState` initializers; read them in `useEffect` — otherwise SSR crashes or hydration mismatches.
- Browser-only libraries that touch `window` at import time (Leaflet) are loaded via `React.lazy` behind `<ClientOnly>` (see `LazyCrossMap`) — static imports crash SSR.
- UI language is chosen per request (cookie `biblebot-lang`, then Accept-Language, then German) in the root loader; the server uses a cloned i18n instance per request — prevents language leaking between concurrent requests and keeps hydration consistent.
- Per-page title/description/canonical/hreflang and Open Graph type/Twitter card come from `<SEOHead>`; the root only adds site-wide tags plus fallback metadata for pages listed in `PAGES_WITHOUT_SEO` — avoids duplicate/conflicting canonical and social tags across Helmet and TanStack head management.
- App-internal server logic uses `createServerFn` in `src/lib/*.functions.ts`; authenticated ones use the `attachSupabaseAuth` middleware and `requireUser()` from `src/lib/supabase-server.server.ts` (imported dynamically inside handlers) — keeps service-role code out of the browser bundle.
- Backend functions with fixed URLs (cron jobs, webhooks, MCP endpoint, public embed script, function-to-function calls) stay as Supabase edge functions — external callers depend on their URLs.
- TypeScript runs with the template's strict flags (incl. `exactOptionalPropertyTypes`); database payloads with optional values go through `omitUndefined()` — matches previous runtime behaviour without loosening types.
