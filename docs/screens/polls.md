# Screens — Polls (Time & Place)

Hero features #1/#2 (`meettime-mvp.md` §3.1/§3.2). One poll entity, `type` time|place.
Back to [app-map](../app-map.md).

---

## `poll/new` ✅ — create a poll
- **Purpose:** create a Time Poll (3–7 slots) or Place Poll (2+ venues).
- **Entry:** "New plan" CTA from `going` / `mine`.
- **Elements:**
  - **Type toggle:** Time Poll | Place Poll.
  - Title input (1–100 chars), placeholder "Board game night 🎲" / "Saturday hangout".
  - **Time:** 7 candidate evening slots (next 7 days, 7pm), tap to pick **3–7**.
  - **Place:** mock venue catalog (`src/lib/places.ts`), tap to pick **2+**; rows show
    ★rating (reviews) · address · "Multisport" badge (mocked).
  - Gradient CTA "Create poll" (disabled until valid).
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | Type toggle | switch form | — | — | — |
  | Pick slot/venue | toggle selection | — | — | — |
  | Create poll | create + slots/options | `polls.create` | `poll_created{type}` | `replace /poll/[id]` |
- **Validation:** title non-empty; Time needs 3–7 slots; Place needs ≥2 venues. Backend
  re-validates 3–7 (`polls.create`).
- **States:** error → Alert "Couldn't create the poll" + message; `poll_abandoned` if left
  before submit (🔭).
- **Exits:** poll/[id].

---

## `poll/[id]` ✅ — vote + organizer aggregate + Convert
- **Purpose:** everyone votes per option; organizer sees the live tally and converts.
- **Entry:** after create; share link (🔭); from board aggregate post.
- **Queries:** `polls.get({ pollId, userId })` (poll + slots/places + my votes),
  `polls.aggregate({ pollId })` (per-option yes/maybe/no).
- **Elements:** one `VoteRow` per slot/venue — title + subtitle + "{yes} yes · {maybe} maybe";
  Yes/Maybe/No buttons (mine highlighted). Leading time slot (most "yes") gets a fern border.
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | Yes / Maybe / No | upsert my vote (per option) | `polls.vote` | `rsvp_submitted`*/`poll_voted` | stays |
  | Convert winning slot → meetup (organizer, Time) | create event + auto-RSVP yes→going/maybe→maybe | `polls.convertToEvent` | `poll_converted_to_event`, `event_created` | `replace /event/[id]` (joy 🎉) |
  | Open the meetup (converted) | go to event | — | — | `replace /event/[id]` |

  *poll voting fires `poll_viewed`/vote events; see [analytics](../analytics-events.md).
- **States:**
  - Loading / not found titles.
  - Converted → voting disabled, subtitle "Converted to a meetup" + "Open the meetup".
  - **Place poll** → no Convert (settles venue only): note "Place polls settle the venue.
    Pair with a Time Poll to lock the date."
  - **Joy moment:** Convert → mock push "Plan's set! You've got a meetup." + 🎉.
- **Exits:** event/[id].

---

## 🔭 Planned
- Native **share sheet** + magic-link guest voting (web view) → soft "Get MeetTime".
- Aggregated **board post** on convert ("5/6 can make Friday 7pm").
- `time_place` combined poll.
