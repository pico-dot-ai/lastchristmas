# Last Christmas – Product Requirements and Delivery Plan

## Context and Goals
- Seasonal “last one standing” companion for Whamageddon, Little Drummer Boy Challenge (LDBC), and custom knockout challenges.
- Primary surface: mobile-first web app with optional PWA “Add to Home Screen.” No required native install.
- Hosting: Vercel for the web app; Supabase for auth, database, and notifications if needed.
- Users sign in without passwords (magic link or passkeys) and play with friends, families, or teams via groups.

## Core Concepts
- **User**: Identified by email; authenticates via magic link or passkey; can belong to multiple groups.
- **Group**: Collection of users; has admins; can host multiple challenges; membership may require approval.
- **Challenge**: Time-bound knockout game with a trigger, start/end window, and ruleset. Built-ins: Whamageddon and LDBC. Custom challenges allowed behind a feature flag.
- **Group Challenge Assignment**: A challenge attached to a group; members may opt in/out individually.
- **Participant Status**: Per user per challenge within a group: `pending`, `accepted`, `declined`, `in`, `out`.
- **Out Event**: User action that records they are out with timestamp, location (if permitted), and optional note.
- **Win**: A participant who remains “in” at the challenge end; all members notified when a challenge ends or everyone is out early.

## Canonical Challenges
- **Whamageddon**: Survive from the day after Thanksgiving through Dec 24 without hearing and recognizing the original “Last Christmas” by Wham!. Covers, remixes, and karaoke tracks are safe and do not knock you out. You are out the moment you recognize the original recording; self-inflicted whams count if using the original. The game ends at 23:59 on Dec 24; remaining players win.
- **Little Drummer Boy Challenge (LDBC)**: Avoid any version of “Little Drummer Boy” (including covers and notable samples) from the day after Thanksgiving through Dec 24. Instrumental elevator tracks and brief snippets count if recognizable. Out at first recognized hearing; survivors at the end win.

## Functional Requirements
### User and Auth
- Passwordless auth: magic link or passkeys; sessions stay long-lived; reauth minimized.
- Profile: display name and avatar optional; email is primary identity.
- Login state persists across app restarts; rehydrate user and group memberships automatically.

### Groups
- Create group; assign admins at creation or later (admins can be assigned before invite acceptance).
- Invite users via shareable link/URL or QR code (invite-only). No public search/discovery; join by invite URL or QR.
- Admins can require approval for new members; approve/deny requests.
- Admins can remove members; members can leave groups. Duplicate groups with identical members are allowed.

### Challenges
- Built-in challenges: Whamageddon and LDBC available to all groups.
- Challenges carry start and end times; cannot be backdated to start before current time without admin override.
- Multiple challenges can be assigned to the same group; each member opts in per challenge.
- Custom challenge creation (feature-flagged): define name, trigger (song/phrase/etc.), start/end, and rule notes. Popular presets can be browsed by everyone and applied to any group.
- Offer new challenges to a group; members choose to accept or decline.

### Participation and Status
- Users view pending invitations (group invites and challenge invites) and accept/decline.
- Challenge roster shows all participants and status (`in` or `out`), with timestamps for outs.
- “I’m out” action: one-tap; records time, optional location (if allowed for the user), text note describing the knockout.
- Notifications to group when a member goes out. Aggregate notification when challenge ends or when all are out early.
- Winners are those still “in” at end time; final table of participants is viewable and shareable.

### Notifications and Sharing
- In-app notifications required; web push when available (Android/web reliable; iOS when installed as a PWA). No email notifications.
- Share group invite and challenge summaries via Web Share API when supported; otherwise copy link. QR codes for group invites; scanning joins or requests to join depending on group settings.

### Admin and Safety Controls
- Admins manage group membership and challenge assignments; can toggle whether new members need approval.
- Feature flag gates custom challenge creation and sharing.
- Location capture on “out” requires per-action consent; store coarse coordinates only (device-native precision). Do not store location for users under 18. Show location only to group members.
- Rate limits on invite generation and “out” actions to reduce spam/abuse.

## Non-Functional Requirements
- Mobile-first responsive UI; touch-friendly controls; offline-tolerant for short drops (queue “out” actions and invites).
- Performance: initial load under 2.5s on mid-tier mobile over 4G; minimize JS bundle.
- Reliability: ensure “out” action is durable; retries with backoff; idempotent backend endpoints.
- Observability: structured logs; minimal analytics focused on feature usage; privacy-first for location data.

## Proposed Stack
- **UI**: Next.js (App Router) + TypeScript + Tailwind (or similar) for speed; server actions/Route Handlers for lightweight APIs.
- **PWA**: Manifest + service worker for A2HS, offline shell, asset pre-cache, and web push. Web Share API; web-based QR scanning.
- **Auth**: Supabase Auth (magic links; passkeys when available) or alternative passwordless provider if constraints arise.
- **Database**: Supabase Postgres; Row Level Security for per-group access.
- **Deploy**: Vercel for the web; Supabase for DB/auth/storage; CI for lint/test/build.
- **Feature flags**: simple config table in Supabase; evaluated client-side with server enforcement.

## Data Model (initial sketch)
- `users`: id, email, display_name, avatar_url, created_at.
- `groups`: id, name, description, requires_approval, created_by, created_at.
- `group_members`: id, group_id, user_id, role (`admin`|`member`), status (`active`|`left`|`removed`), created_at.
- `challenges`: id, name, type (`whamageddon`|`ldbc`|`custom`), trigger_description, start_at, end_at, rules, created_by, feature_flag_key.
- `group_challenges`: id, group_id, challenge_id, created_at, status (`upcoming`|`active`|`ended`|`cancelled`).
- `participants`: id, group_challenge_id, user_id, status (`pending`|`accepted`|`declined`|`in`|`out`), joined_at, opted_out_at.
- `outs`: id, participant_id, occurred_at, location_lat, location_lng, note.
- `invites`: id, group_id, invited_email, invited_by, invite_code, expires_at, status (`pending`|`accepted`|`revoked`).
- `feature_flags`: id, key, enabled, audience.

## API / UX Flows
- Auth: request magic link → confirm → session stored; silent refresh for persistence.
- Group creation: create group → add admins → generate invite link/QR → optional approval gate.
- Join flow: open invite/QR → sign in (if needed) → auto-join or request approval → see assigned challenges.
- Challenge assignment: admin selects built-in or custom challenge → sets start/end → publishes to group → members opt in.
- Out action: participant taps “I’m out” → confirm, optional location + note → save → notify group.
- End-of-challenge: cron/job marks ended; send notifications and present results table.

## Delivery Plan (phased)
- **Phase 0: Project scaffold**
  - Initialize Next.js + TypeScript repo; add Tailwind; set up lint/test (ESLint, Prettier, vitest/playwright later).
  - Configure environment loading; add `.env.example`.
  - Add basic landing page with challenge summaries.
- **Phase 1: Auth and accounts**
  - Integrate Supabase client; passwordless magic link; session persistence; profile stub.
  - Add protected routes/layout and basic account menu.
- **Phase 2: Groups and invites**
  - CRUD for groups; admin roles; invite link/QR; join code entry; approval queue.
  - Member list with remove/leave actions.
- **Phase 3: Challenges**
  - Built-in challenge presets (Whamageddon, LDBC); group-level assignment UI; multi-challenge per group.
  - Participant opt-in/out states; challenge detail view with roster and status filtering.
- **Phase 4: Out reporting and notifications**
  - “I’m out” flow with timestamp, optional location, optional note; resilient submission with retries.
  - In-app notifications feed; email/push hooks for outs and challenge end.
  - Winner summary view for ended challenges.
- **Phase 5: Custom challenges and discovery**
  - Feature-flagged custom challenge creation; validation; sharing/popular presets view.
  - Search/apply community presets to a group.
- **Phase 6: Native and deployment**
  - Capacitor setup for iOS/Android; Web Share, QR scanning, and push wiring.
  - Vercel deployment, Supabase migrations, basic monitoring; add CI for lint/test/build.

## Definition of Done (per phase)
- Code merged with tests and lint passing; migrations applied.
- User-facing acceptance criteria verified on mobile viewport.
- Documentation updated (README + docs) and feature flags configured where applicable.
