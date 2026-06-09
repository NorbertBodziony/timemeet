# Screens — Settings, Profile, Subscription, Referrals, Privacy

All **🔭 Planned** — build specs (not yet in `src/app/`). Backend tables already exist
(`users`, `subscriptions`, `referrals` in `convex/schema.ts`). Mock boundary per
`meettime-mvp.md` §7/§37/§38. Back to [app-map](../app-map.md).

---

## `settings` (home) 🔭
- **Purpose:** hub list linking to each section.
- **Entry:** gear icon in a tab header (e.g. `mine`).
- **Elements:** current user row (avatar, name, "MEETTIME-NAME-XXX"); list rows → Profile,
  Notifications, MeetTime+, Refer a friend, Privacy & data; footer "Sign out" (mock: clears
  the mock session), app version.
- **Actions:** each row → its screen; Sign out → `MockAuthProvider.signOut()` → onboarding.

## `settings/profile` 🔭
- **Purpose:** edit identity.
- **Fields:** display name, photo (from OAuth later — mock picker now), city (default Kraków),
  read-only referral code.
- **Backend:** `users.update({ userId, patch })` (🔭 add). Analytics `profile_updated`.
- **Copy:** title "Your profile"; save "Save".

## `settings/notifications` 🔭
- **Purpose:** push preferences. MVP push is **mocked** (in-app banner), 4 **transactional**
  types only (`meettime-mvp.md` §3.7).
- **Elements:** master toggle; per-type toggles — New invite · Poll resolved · Event cancelled
  · 2h before; note "Quiet hours 22:00–08:00 — coming soon."
- **Backend:** store prefs on `users` (🔭). Analytics `notification_disabled{type}`,
  `push_permission_granted/denied`.
- **Rule:** never "you have N unread"; no marketing push.

## `settings/subscription` (MeetTime+) 🔭
- **Purpose:** plan view + mock upgrade. Payments **mocked** — no Stripe/Apple/Google/BLIK.
- **Elements:** current plan (`free` / `founder` / `meettime_plus` from `subscriptions.plan`);
  MeetTime+ benefits list (unlimited create, unlimited crew, reliability stats, exports,
  partner discounts); price "14.99 zł/mo"; **Founder Edition** one-off card.
- **Actions:**

  | Control | Effect | Convex | Analytics | Navigation |
  |---|---|---|---|---|
  | Upgrade (mock) | set plan flag, no charge | `subscriptions.setPlan` 🔭 | `subscription_started{plan}` | stays |
  | Cancel | back to free | `subscriptions.setPlan` 🔭 | `subscription_cancelled{reason}` | stays |
- **Gating:** premium-only UI reads `subscriptions.plan`; gates are visible but bypassable in
  dev. Free trial = 3 created events/polls lifetime; voting always free.

## `settings/referrals` 🔭
- **Purpose:** share your code (Program §27).
- **Elements:** code `MEETTIME-NAME-XXX`; 3-step reward explainer; Share button (mock link);
  "referred by" optional field.
- **Backend:** `referrals` table; reward activates after referee's **first RSVP** (anti-gaming).
  Analytics `referral_shared`, `referral_activated`.
- **Trigger:** prompt to refer appears after the user's **3rd** organized event (not the 1st).

## `settings/privacy` (Privacy & data / RODO) 🔭
- **Purpose:** data rights. RODO is **deferred infra** in this MVP slice but the screen is
  specced (`meettime-mvp.md` §6/§38).
- **Elements:** analytics opt-in toggle (opt-IN, not opt-out); "Export my data" (🔭);
  **Delete account** (multi-step confirm) → soft delete + 30-day grace.
- **Actions:** Delete → `users.deleteAccount` 🔭 (soft delete; real hard-delete cron later).
  Analytics `account_deleted`.

---

## Notes
- Everything here is behind swappable providers/flags so real auth/payments/push drop in
  without touching feature code (`meettime-mvp.md` §12).
- Founder Edition is the **only** MVP monetization; full subscription is a Launch-phase spec.
