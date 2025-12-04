# Last Christmas

Mobile-first seasonal game companion for Whamageddon, the Little Drummer Boy Challenge (LDBC), and generalized “last one standing” knockout challenges. Runs as a web app with optional “Add to Home Screen” PWA install; hosted on Vercel.

## Canonical Challenges
- **Whamageddon**: Survive from the day after Thanksgiving through Dec 24 without hearing and recognizing the original “Last Christmas” by Wham!. Covers, remixes, and karaoke tracks are safe. You are out the moment you recognize the original recording; self-inflicted whams count. The game ends at 23:59 on Dec 24; remaining players win.
- **Little Drummer Boy Challenge (LDBC)**: Avoid any version of “Little Drummer Boy” (including covers and notable samples) from the day after Thanksgiving through Dec 24. Instrumental elevator tracks and brief snippets count if recognizable. Out at first recognized hearing; survivors at the end win.
- **Generalized Knockout Challenge**: Pick a trigger (song, meme, ad jingle, catchphrase, or location), a start/end window, and participating players. A participant is “out” on first confirmed encounter with the trigger. Multiple challenges can coexist per group; a player is only fully eliminated when out of all active challenges.

## Game Flow (app intent)
- Create/join groups (optionally via invite or QR code) and assign one or more challenges to a group.
- Players accept or decline each group challenge and see live “in/out” status with timestamps and optional notes.
- Going “out” records time and location (with permission) and notifies the group; a final table of survivors is sent at challenge end or when everyone is out.
- Custom challenges can be authored (behind a feature flag) and shared across groups; popular presets remain discoverable.

## Docs and Plans
- Product and delivery requirements live in `docs/requirements.md`.
- Open questions and assumptions (if any) land in `docs/clarifications.md`.

## Status
- Repository initialized; web app scaffolded (`web`).
- Stack choice: Next.js + TypeScript targeting mobile-first web; PWA optional; Vercel deploy; Supabase if/when persistence is added.

## Getting Started (will evolve)
1. Clone the repo and switch into it.
2. Install and run the Next.js app in `web`:
   - `cd web && npm install`
   - `npm run dev` then open `http://localhost:3000`
3. PWA (“Add to Home Screen”) is enabled via `manifest.webmanifest` + `sw.js`; use `npm run dev` to preview locally during web development.
4. Create a `.env.local` in `web` (see `.env.example`) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (used for diagnostics/feature flags only)—do not commit real keys.
5. Deployment target: Vercel. If deploying now, set project root to `web/` or use the provided `vercel.json` (builds Next from `web/package.json`). Supabase is presently used for diagnostics/feature flags; user auth is removed.
6. Database: Supabase migrations live in `supabase/migrations/`. Apply them in order if you need the debug logging + feature flag tables (`api` schema) or the `app` schema tables for future features. Keep service role keys out of the repo.

## Project Guardrails
- Establish formatting, linting, and testing early; record commands and config locations here once configured.
- Add CI details (workflow files, badges, required checks) once a pipeline is set up.
- Capture environment variables, secrets handling, and local overrides in a `.env.example` once available.

## Contributing
- Use focused feature branches and small PRs; link issues or tickets when available.
- Update this README whenever workflow or tooling changes to keep newcomers unblocked.
- Track open questions and decisions here until a dedicated decision log exists.

## Release Checklist (edit as the project matures)
- [ ] Select a license and add it to the repo.
- [ ] Agree on versioning and tagging conventions.
- [ ] Define deploy targets and document the release process.
