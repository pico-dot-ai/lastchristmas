# Guidance for Coding Agents

These instructions apply to the entire repository. Follow them alongside system and user directives.

- Reference materials (e.g., `Reference/`) are for context only and are not the source of record for implementation decisions.

## Core engineering principles
- Prioritize clean, modular code with clear separation of responsibilities; isolate features so changes to one area do not ripple into others.
- Favor simple, holistic solutions over quick fixes. When addressing an issue, consider the surrounding design before implementing changes.
- Keep the mobile-first Next.js 14.2.x + TypeScript stack on Node.js 20.x LTS and Supabase backend architecture in mind (see `docs/architecture.md`).

## Supabase usage
- Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for routine Supabase operations. Reserve `SUPABASE_SECRET_KEY` only for destructive actions. **Do not use `SUPABASE_SERVICE_ROLE_KEY`.**

## Environment and testing
- Copy env vars from `web/.env.example` when needed; see `docs/ops.md` for runtime details.
- Run tests and linters with every code change, except when edits are limited to comments or documentation.

## Implementation expectations
- Maintain feature flags and logging patterns consistent with current Supabase tables (see `supabase/migrations/`).
- Avoid try/catch around imports.
- Prefer structured, observable logging over ad hoc prints.

## Delivery reminders
- Ensure solutions remain PWA-friendly and performant on mobile per `docs/product.md` requirements.
- Keep destructive database operations minimal and safeguarded.
