# Architecture Metadata

## Modular auth + diagnostics boundaries
- **Supabase access control** now centralizes configuration checks via `isSupabaseConfigured` (see `web/lib/supabaseClient.ts`). UI and API modules call this helper before any networked operations to avoid cascading failures when env vars are missing and to keep the Supabase client usage encapsulated.
- **User card self-containment** keeps auth, magic-link, profile, and storage actions isolated to `web/components/user-card.tsx`, relying only on the shared Supabase helpers and diagnostics logger. This prevents leaks into other feature modules when auth changes are deployed.
- **Diagnostics isolation** (`web/lib/diagnostics.ts` + `/app/debug`) uses the scoped API schema client and feature-flag toggles behind explicit readiness checks, so logging/flag changes do not impact the Watch Checker or other pages unless logging is explicitly enabled.

## Change safety practices
- Reusable env readiness checks gate all Supabase calls to avoid runtime crashes in non-authenticated environments and keep optional features from blocking the core Watch Checker experience.
- Logging helpers enforce scope-based writes with configurable retention, ensuring new log scopes can be added without touching unrelated modules.
