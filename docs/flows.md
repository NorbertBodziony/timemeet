# MeetTime — end-to-end user paths

Each step = **screen → user action → backend fn → analytics event → next screen**. Screens are
in [`app-map.md`](app-map.md) / [`screens/`](screens); events in
[`analytics-events.md`](analytics-events.md). ✅ = works today, 🔭 = planned.

---

## Flow 1 — Cold organizer (Karolina's first plan) ✅
Maps to the **activation funnel** (§53.2; target cold→action >40%).

1. `index` → redirect → `(onboarding)/welcome` — `app_opened`.
2. welcome → **Next** → how-time-poll → **Next** → how-place-rsvp → **Let's go** —
   `onboarding_step_completed{1..3}`, `onboarding_completed`.
3. `(tabs)/going` → **New plan** → `poll/new`.
4. poll/new → enter title, pick 3–7 slots → **Create poll** → `polls.create` →
   `poll_created{time}` → `poll/[id]`.
5. poll/[id] → crew votes (other users via "switch user") → `polls.vote` per slot.
6. poll/[id] → **Convert winning slot → meetup** → `polls.convertToEvent` →
   `poll_converted_to_event` + `event_created` → 🎉 push → `event/[id]`.
7. event/[id] → organizer is auto-going; **Share invite link** → `invites.createToken`.

**Aha moment:** the first event that actually happens (NSM, §54).

---

## Flow 2 — Invited flow ⭐ ✅
Maps to **invited→RSVP funnel** (§53; target >70%, time-to-RSVP < 60s guardrail).

1. External link `meettime://invite/<token>` → `invite/[token]` — `invite_link_clicked`,
   `invite_landing_viewed`, `invites.resolve`.
2. landing → tap **Going/Maybe/Waitlist/Not going** → `rsvps.set` → `rsvp_submitted{status}`.
3. (mock auth already present; 🔭 real: quick OAuth here) → confirmation "You're in! 🎉".
4. **Open the meetup** → `event/[id]`.

Edge: expired → "This link has expired"; not_found → "Invite not found"; already a member →
2-tap RSVP.

---

## Flow 3 — Place Poll ✅
1. `poll/new` → toggle **Place Poll** → pick ≥2 venues → **Create poll** → `polls.create`
   `{place}` → `poll/[id]`.
2. poll/[id] → vote venues (Yes/Maybe/No) → `polls.vote`.
3. Settles the **venue**; pair with a Time Poll to lock the date (no direct Convert).

---

## Flow 4 — Direct event + board ✅
1. `event/new` → title, address, time → **Create meetup** → `events.create` → `event/[id]`.
2. event/[id] → **Share invite link** → `invites.createToken` (mock link).
3. Invitees RSVP (Flow 2); organizer posts on the **Board** → `posts.add` (announcement).

---

## Flow 5 — Edit / cancel (anti-flake) ✅ cancel · 🔭 edit
- **Cancel:** event/[id] → **Cancel meetup** → multi-step confirm → `events.cancel` →
  `event_cancelled` → back. Card disappears from active tabs.
- **Edit 🔭:** event/[id] → Edit → change fields → diff → `events.edit` → push to invitees.

---

## Flow 6 — Settings paths 🔭
- **Upgrade (mock):** settings → MeetTime+ → **Upgrade** → `subscriptions.setPlan` →
  `subscription_started`. No charge; premium flags flip.
- **Refer a friend:** settings → Refer → **Share** → mock link; reward activates on referee's
  first RSVP → `referral_activated`.
- **Delete account (RODO):** settings → Privacy → **Delete account** → multi-step confirm →
  `users.deleteAccount` (soft delete + 30-day grace) → `account_deleted` → onboarding.

---

## Funnel coverage (see §53)
| Funnel | Flow | Target |
|---|---|---|
| Cold install → activation | 1 | >40% |
| Invited install → RSVP ⭐ | 2 | >70% |
| Poll → event | 1, 3 | >60% |
| Invite → response | 2, 4 | >80% |
