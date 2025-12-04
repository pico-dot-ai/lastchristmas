# Last Christmas – Developer Guide

Mobile-first seasonal game companion for Whamageddon, Little Drummer Boy Challenge (LDBC), and other “last one standing” challenges. Installable as a PWA; runs on Next.js with Supabase for data/diagnostics.

## What this repo contains
- Next.js 14.2.x + TypeScript app (mobile-first, PWA-ready) in `web/` (requires Node.js 20.x LTS).
- Supabase migrations for feature flags/logging and future game tables in `supabase/migrations/`.
- Documentation in `docs/`:
  - `product.md` – product scope, rules, requirements, and clarifications.
  - `architecture.md` – stack, services, data model sketch, and feature notes.
  - `ops.md` – environment variables, running locally, migrations, and deployment notes.
  - `decisions.md` – resolved decisions and open questions.

## Runtime versions
- Node.js 20.x LTS (preferred for local dev and Vercel builds).
- Next.js 14.2.x (App Router).
- Supabase JS client v2.x against hosted Supabase Postgres.
- Vercel latest build/runtime image (Node.js 20 functions; edge for eligible routes).

## Quick start
1. Copy `web/.env.example` to `web/.env.local` and fill in Supabase + API keys.
2. From `web/`: `npm install` then `npm run dev` and open `http://localhost:3000`.
3. Apply Supabase migrations (see `docs/ops.md`) if you need flags/logging locally.

## Current feature stub
- API: `/api/watch-check` that searches TMDB with iTunes fallback and asks OpenAI for Whamageddon/LDBC risk.
- UI: `WatchChecker` component (not yet on the blank homepage).
- Auth/user flows are removed; Supabase is currently used only for flags/logging.
