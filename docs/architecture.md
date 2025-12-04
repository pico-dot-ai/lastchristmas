# Architecture – Last Christmas

## Stack and runtime
- **UI**: Next.js 14.2.x (App Router) + React + TypeScript; mobile-first; PWA installable.
- **Runtime**: Node.js 20.x LTS locally and on Vercel.
- **Styling**: Tailwind-style utility classes via globals; can adopt full Tailwind config later.
- **API**: Next.js route handlers/server actions; `/api/watch-check` lives under `app/api`.
- **Hosting**: Vercel (root `web/`), latest build/runtime image (Node 20 functions + edge where supported).
- **Data/flags/logging**: Supabase Postgres (Supabase JS v2 client) + RLS; feature flags and debug logs currently active; auth/user tables are present but unused in UI.
- **External services**:
  - OpenAI Responses API (`gpt-4.1-mini`) for Watch Checker assessments.
  - TMDB for primary media search; remote images allowed via `next.config.mjs`.
  - iTunes Search as fallback media source.

## Current features
- **Watch Checker** (`app/api/watch-check` + `lib/watch-check/*` + `components/watch-checker.tsx`):
  - Searches TMDB; falls back to iTunes.
  - Sends candidate metadata + user query to OpenAI; returns assessment of Whamageddon/LDBC risk.
  - Renders match, alternatives, and assessment badge in UI (not yet on the home page).
- **Auth**: Removed; Supabase client remains for flags/logging only.

## Data model (Supabase migrations)
- **app schema** (future): users, groups, group_members, challenges, group_challenges, participants, invites.
- **api schema** (active): feature_flags (key/enabled/value/logging flag), debug_logs (scope/message/meta/created_at/user_id).
- Policies: anon/auth inserts allowed for logs; selects optionally open via migrations; RLS primarily self/admin scoped for app tables.

## PWA and assets
- Manifest + service worker + icons in `web/public`; A2HS enabled.
- Remote images configured for TMDB/iTunes thumbnails.

## Diagrams/flows (to add)
- System diagram (web ↔ Vercel ↔ Supabase ↔ external APIs).
- Key flows: group invite/join, challenge assignment, out reporting, notifications, watch-check request path.
