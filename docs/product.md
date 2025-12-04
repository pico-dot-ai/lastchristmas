# Product – Last Christmas

Mobile-first companion for “last one standing” knockout challenges. Canonical games: Whamageddon and the Little Drummer Boy Challenge (LDBC). Supports custom triggers (song, meme, jingle) behind a feature flag.

## Canonical challenges
- **Whamageddon**: Day after Thanksgiving → Dec 24, avoid the original “Last Christmas” by Wham!. Covers/remixes/karaoke are safe; self-whams with the original count.
- **LDBC**: Day after Thanksgiving → Dec 24, avoid any recognizable “Little Drummer Boy” (covers and notable samples included).
- **Custom**: Name + trigger + rules; shared presets browseable when enabled.

## Core flows
- Create/join groups (invite link/QR; no public search). Admins can require approval.
- Assign one or more challenges to a group. Members accept/decline per challenge.
- Participant status per challenge: `pending` → `accepted`/`declined` → `in` or `out`.
- “I’m out” records time, optional location (with consent, omit under-18), optional note; notifies group.
- Challenge ends at scheduled time or when all are out; survivors win; send/share final table.
- Share summaries and invites via Web Share API or copy link; QR codes for joining.

## Requirements (functional)
- Passwordless auth (magic link or passkeys) when auth is reintroduced; long-lived sessions.
- Group admin controls: invite, approve/deny requests, remove members; members can leave.
- Challenge management: start/end times (no backdating without override), multiple per group, opt-in per member.
- Custom challenges gated by feature flag; popular presets browseable and attachable to any group.
- Notifications: in-app required; web push where supported; no email.
- Safety: rate-limit invites and “out” actions; coarse location only; keep location hidden for minors.

## Requirements (non-functional)
- Mobile-first responsive UI; offline-tolerant for brief drops (queue “out” actions/invites).
- Performance: initial load <2.5s on mid-tier mobile/4G; keep bundle lean.
- Reliability: “out” submission is durable/retriable/idempotent.
- Observability: structured logs; minimal privacy-first analytics; feature flags for risky changes.

## Content and copy anchors
- Challenge windows: day after Thanksgiving → 23:59 Dec 24.
- Whamageddon edge case: only the original knocks you out.
- Evidence on out: text note only (no media uploads).
- Platform stance: mobile web + optional PWA; no required native shell.
