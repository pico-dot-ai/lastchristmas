# Refactor Plan – Last Christmas

## Product scope and goals
- Mobile-first companion for seasonal “knockout” challenges (Whamageddon, Little Drummer Boy Challenge, custom triggers).
- Let players check media for risky songs via an AI-powered “Watch Checker”.
- PWA-friendly (“Add to Home Screen”/desktop install), works well on mobile and desktop.
- Diagnostics and feature flags available for operators.
- **Note:** All auth, magic link flow, and user management have been removed and need fresh re-implementation if required.

## Tech stack
- Next.js 16 (app router) + React 19 + TypeScript, Tailwind utilities via globals.
- Deployed to Vercel (root `web/`), uses Next `next.config.ts` with remote images (itunes, TMDB).
- Supabase (client-side) only for feature flags + debug logging (no auth/user flows in UI).
- PWA assets: `manifest.webmanifest`, `sw.js`, app icons; helper button `PwaHint` for install instructions.

## External services and env vars
- OpenAI Responses API (`model: gpt-4.1-mini`), endpoint `/v1/responses`, JSON schema output.
  - Env: `OPENAI_API_KEY`.
- TMDB search (`/search/multi`) as primary media lookup; thumbnails `image.tmdb.org/t/p/w154`, backdrops `w780`.
  - Env: `TMDB_READ_TOKEN`.
- Supabase for feature flags + debug logs:
  - Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- iTunes Search API as fallback media source (no env).

## Data model (Supabase)
- **app schema** (for future use): `users` (id, display_name, avatar_url, first_name, last_name, dob), `groups`, `group_members`, `challenges`, `group_challenges`, `participants`, `invites`. RLS primarily self/admin scoped.
- **api schema** (actively used): `feature_flags` (key, enabled, value JSON, logging flag), `debug_logs` (scope, message, meta, created_at, user_id). RLS permits anon/auth inserts and selects; anon select enabled via migration 0014.
- Migrations live in `supabase/migrations/` (0001–0014). `api` schema is the active location for flags/logs; `app` tables remain for future features.

## Current UI/features (post-auth removal)
- Home page: hero + challenge cards + roster preview; right column shows **Watch Checker** and **PWA install hint**.
- Watch Checker (`web/components/watch-checker.tsx`):
  - Queries `/api/watch-check` with user text; displays best match, alternatives, assessment badge (“AI RAG”/“Fallback”), and source thumbnail.
  - Responsive layout; TMDB thumbnails allowed via `next.config.ts`.
- PWA hint (`web/components/pwa-hint.tsx`): “+” button toggles OS-specific install instructions; closes on outside click.
- Debug page (`/debug`): shows feature-flag toggle (logging), log viewer (general + OpenAI scopes), works for anon reads after migration 0014. Logging uses Supabase REST fallbacks.
- No user accounts or auth UI/routes remain; `app/auth/callback` and user panels were removed.

## Watch Checker logic (requirements-level)
- Candidate search: TMDB is primary (normalized queries strip season/episode tokens for TMDB; original text retained). Parses season/episode hints (S02E03, “season 2 ep 3”), attaches to candidate.
- Fallback search: iTunes movies/TV if TMDB returns nothing.
- RAG prompt:
  - Sends original player text + candidate metadata (title, year, media type, season/episode, description, original query) and challenge rules.
  - Challenges baked in: Whamageddon (avoid original “Last Christmas”), LDBC (avoid any “Little Drummer Boy”).
  - System prompt demands exhaustive song list (score + licensed/needle-drop), no guessing; warns if unverified.
  - Uses Responses API JSON schema (`best_id`, `assessment`), then parses output array/text.
- API route (`/api/watch-check`) composes search + assessment and returns `{ assessment, match, alternatives, source }`.

## Logging/diagnostics
- Requirements: allow operators to toggle logging on/off and view recent logs (general + OpenAI) via a debug menu. Use Supabase JS client as the primary mechanism; avoid REST fallbacks. Anon read access can be feature-flagged for debugging.
- Data: `api.feature_flags` (logging flag) and `api.debug_logs` (scope/message/meta/created_at/user_id). RLS should permit inserts from anon/auth; selects can be restricted or opened via policy.
- Current state: logging and feature flags are stubbed out (no-op) for refactor; UI remains for future re-implementation.

## Gaps and re-implementation notes
- No authentication, user profile, or magic link flows exist; all related UI/routes/components were removed.
- Supabase client remains for logging/flags; can be reused or replaced.
- If reintroducing auth later: rebuild magic link UI, callback route, Supabase policies, and update README/env guidance accordingly.
