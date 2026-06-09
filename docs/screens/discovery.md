# Screens — Discovery (4 tabs)

Tab bar with 4 tabs, Luma-style vertical lists (no grid). All driven by one query
`events.listByTab({ userId, tab, now })` via the shared `src/components/EventTabList.tsx`.
Back to [app-map](../app-map.md).

## Shared list — `EventTabList`
- **Loading:** themed spinner (no text < 2s).
- **Empty:** warm one-liner (per tab, below).
- **Rows:** `EventCard` per item; tap → `event/[id]`.
- **Analytics:** `screen_viewed{name:<tab>}` on focus.

### `EventCard` anatomy (`src/components/EventCard.tsx`)
- 3px left **stripe** = the viewer's RSVP **semantic** color (accent by default); today →
  **accent** stripe (`meettime-mvp.md` §3.3).
- Title (H2) · `formatDateTime(startsAt)` · address (meta) · "{going} going · {maybe} maybe".
- **"Not going"** card: neutral, `opacity 0.6` + title strikethrough. Never danger-red, never ❌.

---

## `(tabs)/to-confirm` ✅
- **Purpose:** invites you haven't answered (anti-ghosting, top of mind).
- **Query filter:** RSVP = `no_response`, upcoming.
- **Empty:** "Nothing waiting on you. Nice and calm."
- **Exits:** event/[id].

## `(tabs)/going` ✅
- **Purpose:** your confirmed meetups (your calendar).
- **Query filter:** RSVP = `going`, `startsAt ≥ now`, ascending.
- **Header action:** **New plan** (primary CTA) → `poll/new`.
- **Empty:** "Quiet group chat? Drop a time."
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | New plan | start a poll | — | — | → poll/new |
  | tap card | open event | — | — | → event/[id] |

## `(tabs)/history` ✅
- **Purpose:** past meetups (memory + future duplicate 🔭).
- **Query filter:** any RSVP, `startsAt < now`, descending.
- **Empty:** "Your meetup history appears after the first one."

## `(tabs)/mine` ✅
- **Purpose:** events you organized (quick edit access).
- **Query filter:** `creatorId = me`, not cancelled, newest first.
- **Header action:** **New plan** → `poll/new`.
- **Empty:** "Your plans show up here. Start with one."

---

## 🔭 Planned additions
- Category filter chips; Luma-style sticky date headers.
- Direct **New meetup** entry (→ `event/new`) alongside New plan.
- Settings entry point (gear in a tab header) → `settings`.
