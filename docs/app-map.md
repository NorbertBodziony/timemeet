# MeetTime — app map

The single source of truth for **every screen, action, and user path**. Pairs with the build
spec [`meettime-mvp.md`](meettime-mvp.md). Screen detail lives in [`screens/`](screens);
end-to-end paths in [`flows.md`](flows.md); event tracking in
[`analytics-events.md`](analytics-events.md).

Legend: **✅ Built** (exists in `src/app/`) · **🔭 Planned** (specced here, not yet built).

## Screen inventory

| Route (`src/app/…`) | Purpose | Status | Doc |
|---|---|---|---|
| `index.tsx` | Entry redirect → onboarding or tabs | ✅ | — |
| `(onboarding)/welcome` | Cold onboarding 1/3 — slogan | ✅ | [onboarding](screens/onboarding.md) |
| `(onboarding)/how-time-poll` | Cold onboarding 2/3 — Time Poll explainer | ✅ | [onboarding](screens/onboarding.md) |
| `(onboarding)/how-place-rsvp` | Cold onboarding 3/3 — Place + RSVP | ✅ | [onboarding](screens/onboarding.md) |
| `(tabs)/to-confirm` | Discovery tab — invites awaiting reply | ✅ | [discovery](screens/discovery.md) |
| `(tabs)/going` | Discovery tab — confirmed (calendar) + New plan | ✅ | [discovery](screens/discovery.md) |
| `(tabs)/history` | Discovery tab — past meetups | ✅ | [discovery](screens/discovery.md) |
| `(tabs)/mine` | Discovery tab — organized + New plan | ✅ | [discovery](screens/discovery.md) |
| `poll/new` | Create Time **or** Place poll | ✅ | [polls](screens/polls.md) |
| `poll/[id]` | Vote + organizer aggregate + Convert | ✅ | [polls](screens/polls.md) |
| `event/new` | Direct event create (no poll) | ✅ | [events](screens/events.md) |
| `event/[id]` | Event detail — RSVP, board, share, cancel | ✅ | [events](screens/events.md) |
| `invite/[token]` | ⭐ Invited flow — RSVP-first landing | ✅ | [onboarding](screens/onboarding.md) |
| `event/[id]/edit` | Edit event (organizer) + diff | ✅ | [events](screens/events.md) |
| `event/new` (preview step) | Pre-publish read-only preview | ✅ | [events](screens/events.md) |
| `settings/index` | Settings home (+ dev user switch) | ✅ | [settings](screens/settings.md) |
| `settings/profile` | Profile (name, city, referral code) | ✅ | [settings](screens/settings.md) |
| `settings/notifications` | Push prefs (4 transactional types) | ✅ | [settings](screens/settings.md) |
| `settings/subscription` | MeetTime+ / Founder (mock paywall) | ✅ | [settings](screens/settings.md) |
| `settings/referrals` | Referral code + share | ✅ | [settings](screens/settings.md) |
| `settings/privacy` | Privacy/RODO + delete account | ✅ | [settings](screens/settings.md) |

## Navigation graph

```
launch (index)
  └─ not onboarded ─▶ (onboarding) welcome ─▶ how-time-poll ─▶ how-place-rsvp ─┐
  └─ onboarded ─────────────────────────────────────────────────────────────▶ (tabs)
                                                                                 │
  (tabs)  ┌── to-confirm ──┐                                                     │
          ├── going ───────┤── tap card ─▶ event/[id] ──┬─ RSVP (rsvps.set)      │
          ├── history ─────┤                            ├─ board post (posts.add)│
          └── mine ────────┘                            ├─ share ─▶ invite token │
             │  New plan CTA                            └─ cancel (multi-step)    │
             ▼                                                                    │
          poll/new ─(create)─▶ poll/[id] ─(Convert)─▶ event/[id]                  │
             │  (or Place poll)                                                   │
          event/new ─(create)─▶ event/[id]                                        │
                                                                                  │
  external invite link ─▶ invite/[token] ─(RSVP-first)─▶ confirmation ─▶ event/[id]
                                                                                  │
  (tabs) mine ─▶ ⚙ settings ─▶ profile / notifications / subscription / referrals / privacy
```

## Tab bar (4 tabs, light theme locked)
`to-confirm (◔) · going (✓) · history (≡) · mine (★)` — active tint = theme **accent** (HeroUI),
white bar. Defined in `src/app/(tabs)/_layout.tsx`. Luma-style vertical lists (no grid).

## Global providers (`src/app/_layout.tsx`)
`ScopedTheme light` → `SafeAreaProvider` → `GestureHandlerRootView` → `ConvexClientProvider`
→ `MockAuthProvider` → `HeroUINativeProvider` → `MockPushProvider` → `Stack`.
- **MockAuth** holds `currentUser` + dev "switch user" — passes `currentUser._id` into every
  Convex call (mocked-auth seam, `meettime-mvp.md` §12).
- **Convex** real local backend; queries reactive.
- **MockPush** in-app banner stands in for transactional push (`meettime-mvp.md` §3.7).
- HeroUI default light theme; system typography.

## Conventions used across screen docs
- Copy is **verbatim English**, matching the app + glossary (`meettime-mvp.md` §5).
- Actions table columns: **Control → Effect → Convex fn → Analytics event → Navigation**.
- Analytics event names resolve in [`analytics-events.md`](analytics-events.md).
