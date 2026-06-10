# MeetTime — Claude Code rules

MeetTime is a calm-tech mobile app for organizing group meetups with people you already
know. Polish-first. Hero features: **Plan Polls** (ankieta terminu), **Place Polls**
(ankieta miejsca), **5-status RSVP**.

> **Before building any feature, read [`docs/meettime-mvp.md`](docs/meettime-mvp.md).**
> It holds the full feature specs, design tokens, verbatim copy, and the Convex schema.
> Architecture, routes, Convex API surface & token→code map: spec **§10–§14**.
> Every screen, action & user path: [`docs/app-map.md`](docs/app-map.md) →
> [`docs/screens/`](docs/screens) + [`docs/flows.md`](docs/flows.md).

## Stack
- **Expo SDK 56** + Expo Router (typed routes) + **HeroUI Native** + Uniwind / Tailwind v4.
- **Convex — real, local** backend (`npx convex dev`). Schema in `convex/schema.ts`.
- Light/white theme is **locked** via `<ScopedTheme theme="light">` in `src/app/_layout.tsx`
  + `userInterfaceStyle: "light"`. Do not add dark-mode toggles in the MVP.
- Package manager: **bun**.

## Design law (spec §4 + the MeetTime brand sheet)
- The app UI uses **HeroUI Native's light theme** with the **brand palette**: accent =
  Bright Fern `#5DA802` (set in `src/global.css`); danger = Cherry `#FF3D5A`.
- **RSVP semantic system (§03):** each of the 5 statuses has its own functional color in
  `src/lib/theme.ts` `RSVP_COLORS` — going fern / maybe amber / waitlist violet / not-going
  cherry / no-response gray. **App-only — never in marketing/hero/landing assets.**
- **Brand gradients (§04, the only gradients allowed):** `GRADIENTS` in `src/lib/theme.ts` —
  BRIGHT (primary CTA, FilterBar active pill), DEEP (premium tier), STRIPE (today-card edge).
- Use HeroUI color utilities via `className`: `bg-background`, `bg-surface`, `text-foreground`,
  `text-muted`, `border-border`, `bg-accent` / `text-accent-foreground`, `bg-field`.
- Build with HeroUI components: `Button`, `Input`, `Switch`, `Text`, `Surface`, `Spinner` —
  plus the shared `StatusPills`/`SurfaceCard`/`PrimaryButton` brand components.
- **RSVP `"Not going"`** uses Cherry per the brand sheet, but the **copy stays
  non-punishing** ("can't make it this time") — color may be firm, words never are.
- Type: HeroUI default (system) typography — `Text` with `type`/`weight`/`color` props.

## Copy law (full strings in spec §5)
- **Bilingual: Polish (default) + English** — all UI strings live in
  `src/lib/translations/{pl,en}.ts` (use `useT()` / `t()`); server notification titles in
  `convex/i18n.ts`; server errors throw `ConvexError({ k: "errors.…" })` keys. Never
  hardcode user-facing strings. **Sentence case**, **2nd person** ("Cześć, Marta!").
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

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
