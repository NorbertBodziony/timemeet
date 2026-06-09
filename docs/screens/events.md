# Screens — Events

Create, RSVP, board, edit, cancel (`meettime-mvp.md` §3.3–§3.5). Back to [app-map](../app-map.md).

---

## `event/new` ✅ — direct create (no poll)
- **Purpose:** create an event without a poll. Invite-only by default (safety-first).
- **Entry:** 🔭 a "New meetup" CTA (today reachable by route; poll Convert is the main path).
- **Elements:** Title (1–100); Where (custom address); When (pick one of 7 candidate slots,
  6pm); primary CTA "Create meetup".
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | Create meetup | create event + organizer auto-RSVP going | `events.create` | `event_created{from:direct}`, `event_published` | `replace /event/[id]` |
- **Validation:** title + a chosen time. **Default** `visibility: invite_only`.
- **🔭 Planned fields:** category multi-select, capacity, waitlist toggle, description (≤1000),
  contacts picker, Open (Type B) toggle, calendar deeplink after RSVP.

---

## `event/[id]` ✅ — event detail
- **Purpose:** the hub — RSVP, see who's in, board, organizer actions.
- **Query:** `events.get({ eventId, userId })` → event, creator, counts, viewerStatus;
  `posts.listForEvent({ eventId })`.
- **Elements:** info card (date, place, description, "{going} going · {maybe} maybe ·
  {waitlist} waitlist", organizer); **RsvpPicker**; **Board** (input + Send + post list);
  organizer block (Share invite link, Cancel meetup).
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | RSVP status | set my status (5) | `rsvps.set` | `rsvp_submitted{status}`, `rsvp_changed`* | stays |
  | Going (joy-lite) | mock push "You're in — {title}" | `rsvps.set` | `rsvp_submitted{going}` | stays |
  | Send (board) | post (announcement if organizer) | `posts.add` | `post_created` | stays |
  | Share invite link | mint token → Alert mock link | `invites.createToken` | `poll_shared`/`invite_created` | — |
  | Cancel meetup (organizer) | multi-step confirm → cancel | `events.cancel` | `event_cancelled` | back |

  *`rsvp_changed` when moving going→not_going (guardrail signal).
- **States:** loading / not found; cancelled → danger banner "This meetup was cancelled." + RSVP
  hidden; **"Not going"** shows neutral, never danger-red.
- **Multi-step cancel (anti-flake):** "Cancel this meetup?" → "Continue" → "Are you sure?" →
  "Yes, cancel".
- **Exits:** back; invite link (external mock).

---

## `event/[id]/edit` ✅ — edit (organizer)
- Change title/where/notes/when; **diff view** ("CHANGES: field: old → new"); Save → `events.edit`
  → mock push "Updated: {title}" (stands in for push to invitees) → back. Analytics `event_edited`.

## Pre-publish preview ✅ (in `event/new`)
- Tapping **Preview** shows a read-only card of the meetup; **Publish** → `events.create`,
  **Back to edit** returns to the form.

---

## 🔭 Planned
- Aggregated **poll-result post** auto-added on Convert.
- Calendar deeplink (Google/Apple) after RSVP; Maps + Split-bill deeplinks on the card.
- Min-threshold auto-cancel; post-event flow ("Did you get together?").
