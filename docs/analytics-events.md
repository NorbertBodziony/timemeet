# MeetTime — analytics events

The §52 event catalog mapped to the **screen/action** that fires it, so screen docs can
reference event names. Analytics infra (PostHog EU) is **deferred** for this MVP slice — these
are the contract to wire when it lands. Back to [app-map](app-map.md).

Every event carries (§52.7): `userId` (UUID), `appVersion`, `platform`, `locale`,
`isOrganizerPersona`, `daysSinceInstall`. Never send PII (names, addresses, message bodies).

## Acquisition & onboarding (§52.1)
| Event | Fired on |
|---|---|
| `app_installed`, `app_opened` | launch / `index` |
| `signup_started`, `signup_completed{method}` | 🔭 OAuth (mocked today) |
| `onboarding_step_completed{step}` | each onboarding **Next** |
| `onboarding_completed` | how-place-rsvp **Let's go** |
| `invite_link_clicked`, `invite_landing_viewed` | `invite/[token]` open |

## Core flow — polls & events (§52.2)
| Event | Fired on |
|---|---|
| `poll_created{type}` | poll/new **Create poll** |
| `poll_viewed` | poll/[id] open |
| `poll_voted` / vote | poll/[id] Yes/Maybe/No (`polls.vote`) |
| `poll_shared{channel}` | share (🔭) |
| `poll_converted_to_event` | poll/[id] **Convert** |
| `event_created{from:poll\|direct}`, `event_published` | convert / `event/new` create |
| `rsvp_submitted{status}` | RsvpPicker / invite landing (`rsvps.set`) |
| `event_cancelled` | event/[id] cancel |
| `post_created` | board **Send** (`posts.add`) |
| `event_attended`, `event_completed` | 🔭 post-date job |

## Notifications (§52.4) — mocked push
`notification_sent`, `notification_opened`, `notification_dismissed`,
`push_permission_granted/denied`, `notification_disabled{type}` — fired by `MockPushProvider`
+ `settings/notifications` (🔭).

## Sessions & negative signals (§52.5–§52.6)
`screen_viewed{name}`, `session_start/end`; `poll_abandoned{step}`,
`rsvp_changed` (going→not_going = guardrail), `account_deleted`, `subscription_cancelled{reason}`.

## Funnels (§53)
| Funnel | Sequence | Target |
|---|---|---|
| Cold → activation | `app_opened → onboarding_completed → poll_created\|event_created` | >40% |
| Invited → RSVP ⭐ | `invite_link_clicked → invite_landing_viewed → rsvp_submitted` | >70% |
| Poll → event | `poll_created → poll_voted → poll_converted_to_event` | >60% |
| Invite → response | `invite sent → (push) → rsvp_submitted` | >80% |

## North Star & guardrails (§54–§55)
- **NSM:** realized meetups / month — event from a poll, ≥2 "going" at start, not cancelled.
- **Guardrails:** D7 retention <20%, crash >1%, push opt-out >30%, time-to-RSVP >60s, store
  rating <4.0; monitor cancellation rate, rsvp-change rate, organizer-burnout gap.
