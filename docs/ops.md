# Ops and Delivery

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` (preferred for logging; `SUPABASE_SERVICE_ROLE_KEY` as fallback)
- `OPENAI_API_KEY` (Watch Checker)
- `TMDB_READ_TOKEN` (media search)

`web/.env.example` holds placeholders; copy to `web/.env.local`.

## Runtime versions
- Node.js 20.x LTS (local dev parity with Vercel).
- Next.js 14.2.x (App Router).
- Supabase JS client v2.x with hosted Supabase Postgres.
- Vercel latest build/runtime image (Node 20 functions; edge routes where eligible).

## Local development
1. Use Node.js 20.x LTS.
2. `cd web && npm install`
3. `npm run dev` → open `http://localhost:3000`
4. API stub: `/api/watch-check` responds when TMDB/OpenAI keys are set.

## Database and migrations
- Migrations live in `supabase/migrations/` (0014 includes anon select for debug logs).
- Apply in order to a Supabase project; `api.feature_flags` and `api.debug_logs` are the active tables today.
- App tables exist for future auth/groups/challenges but are unused in the current UI.

## Build and deploy
- Build: `npm run build`; Start: `npm run start`.
- Deploy target: Vercel with project root `web/`; ensure env vars set in Vercel and Node.js 20 runtime is selected (functions)/edge where appropriate.
- Web push depends on HTTPS/PWA install; configure when notification features are added.

## Testing/linting (to flesh out)
- ESLint available via `npm run lint`.
- Add unit/e2e tooling as features land (vitest/playwright recommended).
