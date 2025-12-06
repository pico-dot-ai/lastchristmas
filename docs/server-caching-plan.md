## Server-Side Caching and Centralized Data Access (Future Performance Optimization)

### Context and Goals
- Current state: API routes and client calls hit Supabase directly for profiles/avatars (and any future DB access).
- Goal: Centralize Supabase access behind typed repositories/use-cases, then layer a cache-first read path and deferred-write path so reads return quickly from cache and writes are acknowledged immediately, then persisted to DB asynchronously. Applies to profile data and avatar metadata first, then any other DB access.
- Constraints: Preserve data correctness with `updated_at` checks; handle eventual consistency UX states; keep mobile/PWA performance strong.

### Architecture Outline
- **Data access layer (single Supabase entry):** One server-side Supabase client factory plus domain-specific repositories (e.g., `userRepo`, `challengeRepo`) that expose typed methods and shared logging/feature-flag handling. Components and routes call use-cases, not raw Supabase.
- **Cache layer:** Redis (preferred) or Supabase Edge KV. Stores profile JSON + `updated_at` and avatar metadata with a TTL (e.g., 5–15 minutes) and a short stale-while-revalidate window.
- **Queue/worker:** Background job to flush cached writes to Supabase (e.g., a small worker service or background cron). Retries with backoff on failure.
- **Canonical timestamp:** Server sets `updated_at` on writes; reads compare cache `updated_at` with DB to detect staleness.
- **Upload staging:** Avatar uploads go to storage immediately; the metadata (path/URL, updated_at) is cached and queued for DB persistence.

### Centralized Supabase Access Pattern
- **Client factory:** `web/lib/supabase/server.ts` creates the server client with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, shared options, and logging. No components/routes instantiate Supabase directly.
- **Repositories:** `web/lib/repos/{user,challenge,...}.ts` export typed functions (e.g., `getUserProfile`, `upsertUserProfile`, `listChallenges`). Each repo owns column selection, schema typing, and structured logging/error mapping.
- **Use-cases:** `web/lib/use-cases/*.ts` orchestrate repo calls for specific flows (e.g., `getUserCardData(userId)`, `updateAvatar(userId, payload)`), apply feature flags, and house caching keys/invalidations.
- **Call sites:** RSCs, server actions, and API routes call use-cases only. This keeps caching/performance changes isolated to repos/use-cases.

### Read Path (Cache-First)
1) Request hits server route/edge.
2) Use-case checks cache by stable key (e.g., `profile:{userId}`):
   - If fresh: return cached profile/avatar metadata.
   - If stale or missing: fetch from Supabase, set `updated_at` from DB, write to cache with TTL, return.
3) Optional: fire-and-forget background refresh if stale-while-revalidate is desired.

### Write Path (Deferred)
1) Client submits changes (profile fields, gradient color, etc.).
2) Server sets `updated_at = now()`, writes new payload to cache immediately, and enqueues a “persist” job with payload + updated_at.
3) Return success to client using cached data.
4) Worker consumes queue: upsert to Supabase only if DB `updated_at` <= payload `updated_at`; on conflict, log/emit a reconciliation signal and re-cache DB value.
5) On worker error: retry with backoff; if still failing, optionally mark cache entry as “dirty” to force a DB read on next request.

### Avatar Upload Flow (Cached Metadata)
1) Client uploads file to storage (Supabase bucket) via API.
2) API sets `updated_at = now()`, caches profile with new `avatarUrl`, enqueues DB persist of `avatar_url` (and keeps existing gradient/profile fields).
3) Worker persists `avatar_url` to DB with timestamp guard; cache remains the quick source of truth.

### Data Model Additions
- Add `updated_at` column (if not present) on relevant tables (`app.users` for profile/avatar fields). Server, not client, sets this.
- Cache keys: `profile:{userId}` storing `{ profile, updated_at }`.

### Client/UX Considerations
- Show “Saved (syncing)” or similar when write is queued but not yet confirmed in DB.
- On load, prefer cached data; if DB fetch detects fresher data, update UI silently.
- Avatar: show uploaded image immediately from storage URL; DB persistence is deferred.

### Rollout Steps
1) Add `updated_at` column and server-set timestamp on profile upserts.
2) Add Supabase client factory and repositories for the user domain; route all user/profile/avatar access through use-cases.
3) Introduce cache client and lightweight queue abstraction inside use-cases (not in components/routes).
4) Refactor profile GET/PUT and avatar POST routes to call use-cases that implement cache-first + deferred write.
5) Add worker/cron to drain queue and persist to Supabase with timestamp guard.
6) Add logging/metrics for cache hits/misses, queue depth, and conflict resolutions.
7) Extend repos/use-cases + caching to other domains (challenges, playlists) as needed.

### Notes
- This is a future optimization for performance; not yet wired into production routes.
- Keep destructive actions (e.g., delete account) synchronous until safety patterns are defined.
