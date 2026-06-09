# MeetTime — MVP build spec

> Executable build guide for Claude Code. Distilled from the MeetTime brand/product doc.
> Stack: Expo SDK 56 + HeroUI Native + Uniwind/Tailwind v4 + **real local Convex**.
> Mock only: auth, payments, push, deeplink attribution. Everything else is real.
> Language: **English** for all UI copy and code.
> Read alongside [`/CLAUDE.md`](../CLAUDE.md) (the always-on rules).
> Per-screen detail & user paths: [`app-map.md`](app-map.md), [`screens/`](screens),
> [`flows.md`](flows.md), [`analytics-events.md`](analytics-events.md).

---

## 1. Product context

**One line:** MeetTime makes going out with your existing friends a natural choice, not a
week-long project. A mobile app for structured group meetups.

- **Mission:** help people meet more often — without chaos, without burning out one person.
- **Persona — Karolina:** 24–30, Kraków, a crew of 4–8 friends. She's *always* the
  one who writes first and organizes. Pain: organizer fatigue, shame when a plan flops, "nobody
  replies". Wants to meet, not to be responsible for logistics.
- **Two strategic axes:** anti-loneliness + **anti-burnout** (protect "Karolina").
- **4 problem layers:** (1) logistics chaos — "when works for everyone?" → 47 messages; (2) organizer
  burnout; (3) adult friendships fading without active planning; (4) digital loneliness.
- **Emotional target = relief (ulga).** Calm by default; punctuated joy only when a plan
  composes. (Sequence: warmth → relief → calm → *joy when the plan lands* → warm anticipation
  → quiet good feeling.)

---

## 2. MVP principles & non-goals

**6 product principles**
1. Ruthless scope cutting — only core. "Ship ugly v1, beautiful v2."
2. A layer, not a replacement — never compete with Messenger.
3. Regularity, not occasion — everyday meetups, not festivals.
4. Kraków first.
5. Data, not opinions.
6. Safety first — default = **private** event.

**Deliberately NOT building** (each protects positioning)

| Not building | Why |
|---|---|
| Facebook Sign-In | Toxic vibe for 20–30 (privacy/ad targeting) |
| Password change | OAuth — no passwords |
| Crypto payments | App Store ban |
| Bulk contact matching | Breaks positioning + RODO; per-invite lookup only |
| "You have X friends on MeetTime" | Turns it into a social network |
| Push "friend joined" | Notification fatigue |
| PYMK (people you may know) | Hard positioning break |
| Real-time websocket RSVP | Cost + fatigue; board + aggregates suffice |
| People search by name | Stalking risk |
| Social feed | It's a tool, not social media |
| Public organizer leaderboard | Anti-burnout — race + shaming |
| Corp team chat / therapy booking | Wrong category |

---

## 3. Hero features

### 3.1 Time Poll (CORE; without it MeetTime doesn't exist)
- Create: title + **3–7 time slots** (validate 3–7 backend-side).
- Share via native share sheet (Messenger/WhatsApp/IG/Telegram/Discord/SMS) — link is a
  **mocked** deeplink in MVP (manual-paste fallback screen if it "fails").
- Each invitee opens the poll → votes **yes / maybe / no** per slot. In MVP, voting requires a
  (mock) account; guest voting is schema-supported (`pollVotes.userId` nullable) for later.
- Real-time aggregation visible to organizer; aggregated post on the event board
  ("5/6 can make Friday 7:00pm").
- **One-tap Convert:** winning slot → full event with **auto-RSVP "Going/Maybe"** for yes/maybe
  voters. This is a **joy moment** (🎉 allowed).

### 3.2 Place Poll
- Same poll entity, `type = "place"`. Multi-select place options.
- Each option shows: photo, Google Maps rating, address (map deeplink), **"Accepts
  Multisport" badge (mocked flag)**.
- Validation badge (green) when rating ≥ 4.0 and ≥ 50 reviews (data mocked in MVP).

### 3.3 RSVP — 5 statuses (signature; do NOT reduce)

Colors come from HeroUI Native's default theme semantics (no custom palette). The
status → semantic mapping lives in `src/lib/theme.ts`.

| Status (`enum`) | Label | Semantic (HeroUI) | Icon | Meaning |
|---|---|---|---|---|
| `going` | Going | success | ✓ | Confirmed |
| `maybe` | Maybe | warning | ? | Undecided, open |
| `waitlist` | Waitlist | accent | ⏱ | "I'll come if someone drops out" |
| `not_going` | Not going | **neutral** (`default`) | ✕ | **Never punishing** — see below |
| `no_response` | No response | neutral (`default`) | … | Initial state, awaiting decision |

- **"Not going" is never punishing:** rendered with the **neutral** (`default`) semantic, never
  the danger color, no ❌, no "declined". Copy: *"can't make it this time"* ("this time" =
  one-off, not a judgment).
- Card stripe (3px): **Today** = **accent** stripe; other cards = the viewer's RSVP **semantic**
  color. "Not going" card additionally `opacity: 0.6` + strikethrough title. "No response" =
  neutral stripe ("awaiting your decision").

### 3.4 Create / Edit / Cancel event
- **Create:** toggle "Invite only" (Type A, **default**) vs "Open" (Type B, M+1).
  Required: title (1–100), date/time, location (Google place or custom address), category
  (multi-select). Optional: capacity, waitlist toggle, description (≤1000), backup contact.
  Invite via contacts picker + share link (limit 30 in Free). Read-only preview before publish.
  Add to Google/Apple Calendar after RSVP (calendar = **deeplink**, mocked target ok).
- **Edit:** add guests, change date/time/location/details/capacity; diff view; push to all
  invitees (push **mocked**).
- **Cancel:** intentionally **multi-step** (anti-flake).

### 3.5 Event board (posts) — replaces chat
- Posts per event = a channel of intentional messages, **not** a message stream.
- Organizer announcements ("bring your own mugs", "I'll be 15 min late").
- Aggregated Plan Poll result post.

### 3.6 Discovery & list — 4 tabs
1. **To confirm** — invites without a reply (top, anti-ghosting).
2. **Going** — confirmed events (Karolina's calendar).
3. **History** — past events (memory + duplicate).
4. **My events** — organized (quick edit).
- Calendar is **Luma-style vertical scroll**, not a traditional grid.

### 3.7 Push — transactional only (4 types, **mocked** in MVP)
Render as in-app toast + console log behind `mockPush`.

| Push | When | Note |
|---|---|---|
| New invite | invited | preview; target opens >60% |
| Poll resolved | Time/Place poll closed | critical |
| Event cancelled | cancel | "100% delivery" — nobody travels for nothing |
| 2h before | reminder | target opens >70% |

Quiet hours 22:00–08:00 = M+1 (pull into MVP if opt-out >20% in week 1).

### 3.8 Onboarding — two flows
- **Cold flow** (heard about it, opened app): landing slogan "Less planning. More meetups."
  → OAuth signup (**mock**) → plan choice (Free default) → Lutek intro → Time Poll explainer →
  first-action prompt. Target <2 min to first action. **3 screens** before login, max 4. Light
  dot indicator, no "1 of 3" progress bars.
- **Invited flow** ⭐ **CRITICAL** (clicked an event link): invite landing (inviter avatar,
  title, date, place, #confirmed) → **RSVP first**, then quick (mock) auth → Lutek
  confirmation "Nice, I'll let [name] know!". Target **RSVP < 30 s**.
- **Edge cases:** already logged-in + invite → deep-link straight to RSVP (2 taps); expired
  link (>14 days) → "This link has expired…"; invite after event date (M+1); guest poll voting
  via web view then soft "Get MeetTime"; deeplink fail → manual paste screen.

---

## 4. Design system

The app UI uses **HeroUI Native's default light theme** — a clean, native-iOS / Apple-like
look: system background, hairline separators, system (SF-like) typography, an accent-driven
tint, semantic success/warning/danger, generous spacing, rounded cards. No custom palette, no
gradients.

### 4.1 Color utilities (HeroUI default — no hex)
Use HeroUI's theme utilities directly via `className`:

| Utility | Use |
|---|---|
| `bg-background` | screen background |
| `bg-surface` | cards, inputs, sheets |
| `text-foreground` | headings, primary text |
| `text-muted` | body, meta, timestamps |
| `border-border` | cards, dividers |
| `bg-field` / `text-field-foreground` | input fields |
| `bg-accent` / `text-accent-foreground` | primary action / selected state |

### 4.2 Semantics (HeroUI — UI only)

| Semantic | Use |
|---|---|
| `success` | confirmed states, "everyone's going", RSVP Going |
| `warning` | RSVP expiring, warnings, RSVP Maybe |
| `danger` | cancel, delete, leave, error |
| `accent` | primary tint, RSVP Waitlist, today stripe |
| `default` (neutral) | disabled, "no response", RSVP **Not going** |

The danger semantic is never used for "Not going" (copy law). Components: `Button`, `Input`,
`Switch`, `Chip`, `Text`, `Surface`, `Spinner` — all themed by HeroUI.

### 4.3 Typography
HeroUI default type scale (system / SF-like font). Use the `Text` component with `type`
(`h1`–`h6`, `body`, `body-sm`, `body-xs`), `weight` (`normal`/`medium`/`semibold`/`bold`),
and `color` (`default`/`muted`). No custom font is required.

**Wordmark:** always `MeetTime` (camelCase); rendered in the theme foreground color, no gradient.

### 4.4 Lutek (mascot)
Otter (social animal → reinforces anti-loneliness). Voice: 1st person, casual English, "no
stress", "we've got this". **Visible only** in onboarding (cold + invited) and the **3–5 joy
moments**.
Empty states outside onboarding use minimalist illustrations *without* the mascot. Celebration
micro-animations (Lottie, ≤1.5 s) only when a plan composes.

---

## 5. UX copy library (verbatim EN — copy-paste these strings)

**Glossary — use these words EXACTLY:** Time Poll, Place Poll, crew / squad (never
"community"/"users"), Lutek, you in?, meetup (finalized), plan (in prep). Mascot name "Lutek"
stays as-is.

**Onboarding (3 screens):**
- 1: "People are in. No date yet. We've got this."
- 2: "Drop some times. Crew taps. Done."
- 3: "Place works? You in? The app collects, you meet up."
- CTAs: "Next" → "Next" → "Let's go". Welcome: "Welcome! Glad you're here." / "I already have an account".

**Empty states:**
- No events: "Quiet group chat? Drop a time."
- No polls: "Your plans show up here. Start with one."
- No crew: "Invite your crew with a share link."
- No history: "Your meetup history appears after the first one."
- Nobody answered: "The group's reading. The group's thinking."

**CTAs (≤3 words):** main "Create poll" · "Send" · "Going" · "Let's go"; secondary "Maybe" ·
"Waitlist" · "Not going" · "Later"; destructive "Delete" → confirm "Yes, delete".
Banned: "Click here", "Learn more", "Get started", "Submit", "OK".

**RSVP labels:** Going · Maybe · Waitlist · Not going · No response.

**Errors (apologize, never blame; say what + what to do):**
- No internet: "The internet wandered off. Give it another try."
- Timeout: "Taking longer than usual. Try refreshing."
- Wrong password: "That password doesn't match. Check it again."
- Crew full: "Crew's full — remove someone or raise the limit in premium."
- Loading >5s: "Dragging a bit. Weak signal?"

**Loading:** <2s no text; >2s "One sec…" (animated dots); >5s "Dragging a bit. Weak signal?".

**Success — two levels (keep the line sharp or joy stops meaning anything):**
- **Level 1 — operational** (UI confirmations): short, calm, neutral, **no** Lutek/🎉/!.
- **Level 2 — joy** (plan composes; 🎉/✨ + celebrating Lutek + ≤1.5 s anim; max one "!", 3–5×/cycle):
  - "Plan's set! 🎉 You're meeting Wednesday, 6:00pm."
  - Threshold met: "We've got a crew! 6 people in."
  - Invite (first screen): "Hi, Marta! What are we planning?"
  - 2h before: "You're meeting in 2 hours 👀"
  - Threshold failed: "Not this time. We'll get it next time."
  - After event: "That happened. Glad you got together."
  - Last-minute cancel: "Plan fell through 😵 We'll nail the next one faster."

**Reminders:** 24h "Tomorrow at 6:00pm you're meeting at Maciek's." · 1–2h "You're meeting in
an hour 👀" · day-after "Did you get together? Let us know how it went."

**Push (≤8–10 words; name + action + signal; no "respond now", no unread counts):**
- "Marek's in 👌" · "[Name] invited you to [title] — [date]". 🎉 only in joy pushes.

**Headers / contextual:** "Hi, Marta! What are we planning?" · "When works?" · "Who's in? Plan's
ready." · "You're meeting tomorrow" · "Your meetups" · "Meetup confirmed!" · "Suggested time:
Wed, May 14, 6:00pm".

**Main slogan:** "Less planning. More meetups." The "less X, more Y" pattern is the brand patent.

---

## 6. Convex data model (`convex/schema.ts`)

Real reactive Convex. Use Convex `_id`/`_creationTime` (replaces the source's UUID-PII pattern).
Define indexes for every lookup the UI does. RSVP keeps all **5 statuses**. Soft-delete / RODO
hard-delete cron is **deferred** (note fields but don't build the infra in this slice).

| Table | Purpose | Key fields | Relations / indexes |
|---|---|---|---|
| `users` | Account (mock auth) | `displayName`, `email?`, `city` (default "Kraków"), `photoUrl?`, `referralCode` (`MEETTIME-NAME-XXX`), `authSubject?` | `by_authSubject` |
| `polls` | Time/place poll | `creatorId`, `type` (`time`/`place`/`time_place`), `title`, `status` (`active`/`closed`/`converted`), `expiresAt` (default +14d), `eventId?` | `by_creator`, `by_status` |
| `pollSlots` | Time options (3–7) | `pollId`, `startsAt`, `endsAt`, `position` | `by_poll` |
| `pollPlaceOptions` | Place options | `pollId`, `placeId`, `name`, `address`, `lat`, `lng`, `rating?`, `reviewCount?`, `partnerId?` | `by_poll` |
| `pollVotes` | Votes | `pollId`, `userId?` (**nullable** = guest), `guestName?`, `slotId?`, `placeOptionId?`, `value` (`yes`/`maybe`/`no`) | `by_poll`, unique-ish `by_poll_user_slot` |
| `events` | Finalized meetup | `creatorId`, `sourcePollId?`, `title`, `startsAt`, `endsAt?`, `placeId?`, `customAddress?`, `category`, `visibility` (`invite_only`/`open`), `capacity?`, `waitlistEnabled`, `minThreshold?`, `description?`, `status` (`draft`/`published`/`cancelled`/`finished`) | `by_creator`, `by_status`, `by_startsAt` |
| `eventInvites` | Invites + tokens | `eventId`, `inviteeUserId?`, `inviteToken`, `expiresAt` (+14d), `usedAt?` | `by_event`, `by_token` |
| `rsvps` | Attendance | `eventId`, `userId`, `status` (`going`/`maybe`/`waitlist`/`not_going`/`no_response`), `changedAt` | `by_event`, unique `by_event_user` |
| `posts` | Event board | `eventId`, `authorId`, `body`, `isAnnouncement`, `_creationTime` | `by_event` |
| `partners` | B2B venues | `name`, `placeId`, `sportCardFlags` (multisport/medicover/pzu/ok_system), `placementPaidUntil?`, `commissionTier?` | `by_placeId` |
| `referrals` | Referral program | `referrerId`, `refereeId?`, `code`, `activatedAt?`, `rewardGrantedAt?` | `by_code`, `by_referrer` |
| `subscriptions` | Plan (mock pay) | `userId`, `plan` (`free`/`meettime_plus`/`founder`), `trialCountEvents` (≤3), `status`, `currentPeriodEnd?` | `by_user` |
| `crews` (M+1) | Persistent paczka | `name`, `createdBy`, `privacy` + `crewMembers` (`crewId`,`userId`,`role`); `events.crewId?` | `by_crew` |

**Rules:** validate 3–7 slots backend-side; `pollVotes.userId` nullable enables guest voting;
invite tokens expire 14d; `rsvps` unique per (event, user).

---

## 7. Mock strategy (keep app operational)

All mocks behind swappable providers so real impls drop in untouched later.
- **`MockAuthProvider`** — React context exposing `currentUser`. OAuth/Magic-Link buttons are
  no-ops that set a seeded mock session. Expose a quick "switch user" in dev to test invitee
  flows. Real Convex `users` rows back the mock identities.
- **`mockPayments`** — everyone is `free` (or `founder` for demo). No Stripe/Apple/Google/BLIK.
  Premium-gated UI reads the `subscriptions.plan` flag; gates are visible but bypassable in dev.
- **`mockPush`** — renders an in-app toast + `console.log`; same payload shape as a real push so
  swapping to Expo Notifications later is mechanical.
- **Deeplink / Branch** — mocked; share buttons copy a fake link; provide the "paste invite
  link" manual fallback screen.
- **Seed** — a Convex `seed` mutation creating: current user "Karolina" + a demo crew (4–8
  members), one sample Plan Poll (mid-vote), and one upcoming event with mixed RSVPs — so the
  app is usable on first launch. Run via `npx convex run seed`.

---

## 8. Build order (critical path; first slice marked)

Infra/RODO blockers from the source doc are **dropped** for this MVP (Convex local replaces
Supabase; no PostHog/Stripe/DG required to run).

1. **Convex schema + seed** (`convex/schema.ts`, `convex/seed.ts`) + Convex client in app.
2. **Mock auth** (`MockAuthProvider`, current-user context, OAuth no-op buttons).
3. ⭐ **First slice — core flows:** Plan Polls (create → vote → aggregate → Convert) → **RSVP
   (5 statuses)** → **event create**. Real Convex queries/mutations.
4. **UI / Lutek + onboarding** — HeroUI default light theme,
   Lutek illustrations, Cold (3) + Invited (critical) onboarding, empty states, joy animations.
5. **Discovery** — 4 tabs + Luma-style vertical calendar.
6. **Posts** — event board (announcements + aggregated poll result).
7. **Push (mock)** — 4 transactional types via `mockPush`.
8. **Polish** — Place Polls, edit/cancel event, referral code field, settings, profile (minimal).

---

## 9. Deferred (keep scope cut)

- **M+1:** benefit cards (Multisport/Medicover/…), full profile + reliability score, public
  (Type B) discovery + map, quiet hours + smart pushes, min-threshold auto-cancel, organizer
  posts/mute/post-event flow, duplicate/recurring events, referral tiers, **Crews**.
- **M+2:** Multisport-only filter, cost indicator, cancel strikes, follow person, partner
  promos, post threading, venue rating, host-approval flow (premium).
- **M+3:** event map as home, 24h booking timer, in-app invite, "who usually shows up",
  anniversaries, ride/booking deeplinks.
- **v2/v3:** SMS verification, stranger discovery (re-validate vs positioning), Strava/Health
  import, native bookings API, direct partner reservations, full gamification, public profiles.

---

## 10. Project structure & routing

**Expo Router tree** (`src/app/`):

```
src/app/
  _layout.tsx              # root: ScopedTheme light + providers (Convex, MockAuth, push)
  index.tsx                # entry → redirect to (onboarding) or (tabs) based on mock session
  (onboarding)/
    _layout.tsx            # Stack, headerShown:false, dot indicator
    welcome.tsx            # cold screen 1
    how-time-poll.tsx      # cold screen 2
    how-place-rsvp.tsx     # cold screen 3
  (tabs)/
    _layout.tsx            # Tabs (4)
    to-confirm.tsx         # tab 1 — invites awaiting reply (anti-ghosting)
    going.tsx              # tab 2 — confirmed (calendar)
    history.tsx            # tab 3 — past
    mine.tsx               # tab 4 — organized
  poll/[id].tsx            # Time/Place poll: vote + organizer aggregate + Convert
  event/new.tsx            # create event (also reached from poll Convert)
  event/[id].tsx           # event detail: RSVP, board posts, edit/cancel (organizer)
  invite/[token].tsx       # ⭐ invited flow — RSVP first, then quick auth
```

`_layout.tsx` already locks the light theme (`<ScopedTheme theme="light">` + StatusBar dark).

**Folder conventions** (outside routes):

```
convex/                    # schema.ts + feature functions (polls.ts, events.ts, rsvps.ts, …) + seed.ts
src/components/            # shared UI (RsvpButtons, EventCard, PollSlotRow, LutekIllustration, EmptyState)
src/providers/             # MockAuthProvider, ConvexClientProvider, MockPushProvider
src/lib/                   # helpers — date/time format, share-link mock, validators
src/theme/                 # token map consumed by Tailwind/Uniwind config
```

**Setup (step 0)** — `bunx convex dev` scaffolds `convex/` + writes `EXPO_PUBLIC_CONVEX_URL`
to `.env.local` and keeps the local dev backend running; wrap the app in `<ConvexProvider>`
(inside `MockAuthProvider`) in `src/app/_layout.tsx`. Run `bunx convex run seed:run` once for
demo data (§7).

**Date/time convention** — store all timestamps as **epoch milliseconds (UTC)** in Convex
(`startsAt`, `endsAt`, `expiresAt`, …). Format for display only, in `src/lib` (e.g.
`Wed, May 14, 6:00pm`). Never store formatted strings; never assume device timezone server-side.

## 11. Convex API surface

The function inventory the schema implies. Every **mutation** (and identity-scoped query)
takes an explicit `userId: v.id("users")` arg — see §12. Names are `file.export`.

| Function | Kind | Args (besides `userId`) | Notes |
|---|---|---|---|
| `polls.create` | mutation | `type`, `title`, `slots[]` or `placeOptions[]` | validate 3–7 slots |
| `polls.get` | query | `pollId` | poll + slots/options |
| `polls.listMine` | query | — | organizer's polls |
| `polls.vote` | mutation | `pollId`, `slotId?`/`placeOptionId?`, `value` | upsert per (poll,user,slot) |
| `polls.aggregate` | query | `pollId` | per-slot yes/maybe/no counts |
| `polls.convertToEvent` | mutation | `pollId`, `winningSlotId` | creates event + auto-RSVP yes/maybe → going/maybe; sets poll `converted` |
| `events.create` | mutation | event fields | `visibility` default `invite_only` |
| `events.edit` | mutation | `eventId`, patch | organizer only |
| `events.cancel` | mutation | `eventId` | multi-step confirm in UI |
| `events.get` | query | `eventId` | event + place + counts |
| `events.listByTab` | query | `tab` (`to_confirm`/`going`/`history`/`mine`) | drives the 4 tabs |
| `rsvps.set` | mutation | `eventId`, `status` | one of 5 statuses; unique per (event,user) |
| `rsvps.listForEvent` | query | `eventId` | grouped by status |
| `posts.add` | mutation | `eventId`, `body`, `isAnnouncement` | board post |
| `posts.listForEvent` | query | `eventId` | newest first |
| `invites.createToken` | mutation | `eventId` | returns mock share link |
| `invites.resolve` | query | `token` | invite landing data; null if expired (>14d) |
| `seed.run` | mutation | — | dev seed (§7) |

## 12. Mock-auth ↔ Convex wiring ⚠

Mocked auth means **`ctx.auth.getUserIdentity()` is null** — do not rely on it. Instead:

- Every identity-scoped function takes `userId: v.id("users")` as an **explicit arg**, and
  validates it server-side (`db.get(userId)` exists; ownership checks where relevant).
- `MockAuthProvider` (React context) holds `currentUser` (a real `users` row) and a dev-only
  **"switch user"** control to exercise the invited flow. The app passes `currentUser._id`
  into every Convex call.
- This is a deliberate seam: when real auth lands, add `ctx.auth` + an `identity → users`
  lookup helper (`getCurrentUser(ctx)`) and drop the `userId` arg — **feature code unchanged**.

## 13. Theme in code (HeroUI default)

No custom palette. `src/global.css` imports `heroui-native/styles`, which provides the default
light theme + its color utilities.

- Use HeroUI utilities directly via `className`: `bg-background`, `bg-surface`,
  `text-foreground`, `text-muted`, `border-border`, `bg-accent` / `text-accent-foreground`,
  `bg-field`, and semantics `success` / `warning` / `danger` / `default`. Example:
  `className="bg-surface border border-border text-foreground"`.
- **RSVP → semantic** mapping (`going→success`, `maybe→warning`, `waitlist→accent`,
  `not_going→default`, `no_response→default`) lives in `src/lib/theme.ts`.
- **Primary CTA** is HeroUI's `Button` (`variant="primary"`) — no gradients, no
  `expo-linear-gradient`.
- **Fonts** — HeroUI's default (system) typography. No custom font required; use the `Text`
  component's `type`/`weight`/`color` props.

## 14. First-slice acceptance checklist

The first slice (§8) is "done" when, on real local Convex with the seeded mock user:

- [ ] Create a **Time Poll** with 3–7 slots (validation rejects <3 or >7).
- [ ] Vote **yes / maybe / no** per slot; organizer sees a **live aggregate** update.
- [ ] **One-tap Convert** the winning slot → an event is created with **auto-RSVP** (yes→going,
      maybe→maybe) for those voters.
- [ ] On the event, set RSVP through **all 5 statuses**; "Not going" shows **no red / no ❌**.
- [ ] The event appears in the **correct Discovery tab** (`going` when going; `mine` for the
      organizer; `to-confirm` for an un-answered invitee).
- [ ] Theme stays **white**; all visible copy matches the **glossary** (§5).

---

## Verification (when building)
`npx convex dev` (local) + `bun run ios` → create a Time Poll, vote across slots, **Convert** to
an event, set RSVP through all 5 statuses, and confirm it appears in the right Discovery tab —
proving **real Convex + mocked auth**. Check copy matches the glossary, "Not going" shows no red,
and the theme stays white.
