# Screens — Onboarding & Invited flow

Two entry paths (`meettime-mvp.md` §3.8). **Cold** = heard about it, opened the app.
**Invited** ⭐ = tapped an event link (the higher-conversion path). Lutek appears here and only
here (+ joy moments). Back to [app-map](../app-map.md).

---

## Cold onboarding — 3 screens

Shared component `src/components/OnboardingSlide.tsx`: big headline, body line, light **dot
indicator** (never "1 of 3"), one gradient CTA. Rule: max 4 screens, 3 before login.

### `(onboarding)/welcome` — 1/3 ✅
- **Purpose:** brand hello + main slogan.
- **Entry:** `index` redirect when not onboarded.
- **Elements:** Display headline "Less planning.\nMore meetups."; body "People are in. No date
  yet. We've got this."; dots ●○○; CTA "Next".
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | Next | advance | — | `onboarding_step_completed{step:1}` | → how-time-poll |
- **Exits:** how-time-poll.

### `(onboarding)/how-time-poll` — 2/3 ✅
- **Purpose:** explain Time Poll.
- **Elements:** headline "When works?"; body "Drop some times. Crew taps. Done."; dots ○●○; CTA "Next".
- **Actions:** Next → `onboarding_step_completed{step:2}` → how-place-rsvp.

### `(onboarding)/how-place-rsvp` — 3/3 ✅
- **Purpose:** explain Place Poll + RSVP.
- **Elements:** headline "Place works? You in?"; body "The app collects, you meet up."; dots ○○●; CTA "Let's go".
- **Actions:** Let's go → `onboarding_step_completed{step:3}` + `onboarding_completed` →
  `replace /going`.
- **🔭 Planned (real auth):** OAuth signup (Apple/Google/Magic Link) + plan choice (Free
  default) inserted before reaching tabs. Today auth is mocked, so it goes straight to tabs.

**States:** static; no loading. **Copy** verbatim above.

---

## Invited flow ⭐

### `invite/[token]` — landing ✅
- **Purpose:** let an invitee RSVP in < 30s. RSVP-first, auth after (collapsed today — mock
  user is always present).
- **Entry:** external deep link `meettime://invite/<token>` (mocked; share button copies it).
- **Query:** `invites.resolve({ token, now })` → `ok | expired | not_found`.
- **Elements (ok):** "{inviter} invited you" · title · `formatDateTime(startsAt)` · address ·
  "{n} going"; prompt "Are you in?"; `RsvpPicker` (Going/Maybe/Waitlist/Not going).
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | (open) | view landing | `invites.resolve` | `invite_link_clicked`, `invite_landing_viewed` | — |
  | RSVP status | set + confirm | `rsvps.set` | `rsvp_submitted{status}` | stays → confirmation block |
  | Going (joy) | mock push "Nice, we'll let {inviter} know!" | `rsvps.set` | `rsvp_submitted{going}` | confirmation |
  | Open the meetup | go to event | — | — | `replace /event/[id]` |
- **States:**
  - `expired` → "This link has expired" + "Ask the organizer for a fresh invite."
  - `not_found` → "Invite not found" + "Double-check the link and try again."
  - confirmed going → "You're in! 🎉" (joy); not_going → "No worries — maybe next time."
- **Edge cases (`meettime-mvp.md` §3.8):** already a member → 2-tap RSVP; invite after event
  date (🔭) → "This one already happened. See what {inviter} plans next."; Branch fail (🔭) →
  manual paste screen.
- **Exits:** event/[id].

**Lutek:** confirmation is a joy moment — celebrating Lutek + single 🎉 (max 3–5 per cycle).
