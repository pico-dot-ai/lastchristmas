# Clarifications
- **Resolved — Challenge window**: Whamageddon and LDBC both run from the day after Thanksgiving through Dec 24 (ending 23:59 Dec 24). Update all rules and UI copy to reflect this.
- **Resolved — Whamageddon edge cases**: Only the original “Last Christmas” recording knocks players out; remixes and covers do not count. (Need stance on intentional sabotage/self-play if relevant.)
- **Resolved — Location granularity**: Use device-native location precision (iOS location sharing constraints). Do not store location for users under 18.
- **Resolved — Notifications**: Use web push where supported plus an in-app notifications section. Do not send email notifications.
- **Resolved — Group discovery**: Groups are invite-only via link/URL (QR okay). No public search/discovery.
- **Resolved — Custom challenges**: Custom challenges are browseable by everyone and can be selected and applied to any group.
- **Resolved — Evidence on out**: Text note only when a player goes out; no media attachments.
- **Resolved — Platform**: Mobile-first web app with optional PWA “Add to Home Screen”; no required native (Capacitor) shell.
- **Open — Compliance**: Any additional regional privacy/age requirements beyond omitting location for users under 18?
