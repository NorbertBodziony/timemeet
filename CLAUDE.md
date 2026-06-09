# MeetTime — Claude Code rules

MeetTime is a calm-tech mobile app for organizing group meetups with people you already
know. Polish-first. Hero features: **Plan Polls** (ankieta terminu), **Place Polls**
(ankieta miejsca), **5-status RSVP**.

> **Before building any feature, read [`docs/meettime-mvp.md`](docs/meettime-mvp.md).**
> It holds the full feature specs, design tokens, verbatim copy, and the Convex schema.
> Architecture, routes, Convex API surface & token→code map: spec **§10–§14**.

## Stack
- **Expo SDK 56** + Expo Router (typed routes) + **HeroUI Native** + Uniwind / Tailwind v4.
- **Convex — real, local** backend (`npx convex dev`). Schema in `convex/schema.ts`.
- Light/white theme is **locked** via `<ScopedTheme theme="light">` in `src/app/_layout.tsx`
  + `userInterfaceStyle: "light"`. Do not add dark-mode toggles in the MVP.
- Package manager: **bun**.

## Design law (full detail in spec §4)
- The **mono-green** palette IS the brand. Slime Lime `#A3FF12` + Evergreen `#0F1A00` are the
  signature. Stay inside the 9 brand greens for anything brand/marketing-facing.
- **RSVP / semantic colors** (Amber, Violet, Cherry Red, Gray) are **UI-only** — never in
  marketing, hero, onboarding, or screenshots.
- Type: **Lato** weights **400 / 700 / 900 only** (Lato has no 500/600 — headings use 700).
- Primary green gradient CTA needs **separate `background-color` + `background-image`** — the
  CSS `background:` shorthand renders it black/white. See spec §4.

## Copy law (full strings in spec §5)
- **English**, **sentence case**, **2nd person** ("Rally your crew", "Hi, Marta!").
- Use the **MeetTime glossary** words exactly: crew / squad (never "community"/"users"),
  Lutek, Time Poll, Place Poll, meetup, plan, you in?, no stress.
- **`"Not going"` is NEVER punishing** — zero red, zero ❌, zero "declined". Phrasing: "can't
  make it this time".
- 🎉 / ✨ and the celebrating Lutek appear **only in the 3–5 "joy" moments** (plan composes,
  RSVP threshold met, event created, day-before). Everywhere else stays calm. Max one "!".
- Errors never blame the user; always say what happened + what to do.
- No corpo-speak, no "Click here", no ALL CAPS.

## Mock law
**Mocked** (no external accounts/services in MVP): auth/login (OAuth), payments/subscription
(Stripe/BLIK), push notifications, deeplink attribution (Branch). **Real:** everything else —
polls, votes, events, RSVP, posts — runs on **real local Convex**.
- Keep mocks behind swappable providers (`MockAuthProvider`, `mockPayments`, `mockPush`) so a
  real implementation drops in later without touching feature code.
- The app must be **fully operational end-to-end** with mocks: a seeded current user + demo
  crew + sample poll/event so first launch is usable.

## Convex law
- Schema lives in `convex/schema.ts`; queries/mutations are real and reactive (no DB mocks).
- Seed data via a Convex seed mutation so the app has content on first run.
- RSVP keeps all **5 statuses**; `pollVotes.userId` is nullable (guest voting). RODO/soft-delete
  infra is out of this MVP slice (see spec §6).

## Build order (first slice marked — spec §8)
Convex schema + seed → mock auth → **core flows: Plan Polls → RSVP → event create** ←first
slice → UI / Lutek + onboarding → discovery (4 tabs) → posts → push (mock) → polish.
